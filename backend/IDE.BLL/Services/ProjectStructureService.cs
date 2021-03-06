﻿using AutoMapper;
using IDE.BLL.ExceptionsCustom;
using IDE.BLL.Interfaces;
using IDE.Common.DTO.File;
using IDE.Common.ModelsDTO.DTO.Workspace;
using IDE.Common.ModelsDTO.Enums;
using IDE.DAL.Entities.NoSql;
using IDE.DAL.Interfaces;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using File = System.IO.File;
using Newtonsoft.Json;

namespace IDE.BLL.Services
{
    public class ProjectStructureService : IProjectStructureService
    {
        private readonly IProjectStructureRepository _projectStructureRepository;
        private readonly FileService _fileService;
        private readonly IMapper _mapper;
        private readonly ILogger<ProjectStructureService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IFileEditStateService _stateService;

        public ProjectStructureService(
            IProjectStructureRepository projectStructureRepository,
            FileService fileService,
            IMapper mapper, ILogger<ProjectStructureService> logger,
            IConfiguration configuration,
            IFileEditStateService stateService)
        {
            _projectStructureRepository = projectStructureRepository;
            _fileService = fileService;
            _mapper = mapper;
            _logger = logger;
            _configuration = configuration;
            _stateService = stateService;
        }

        public async Task<ProjectStructureDTO> GetByIdAsync(string id)
        {
            var projectStructure = await _projectStructureRepository.GetByIdAsync(id);
            if (projectStructure == null)
            {
                throw new NotFoundException(nameof(ProjectStructure), id);
            }
            
            var projectStructureDto = _mapper.Map<ProjectStructureDTO>(projectStructure);
            return projectStructureDto;
        }

        public async Task<int> GetFileStructureSize(FileStructureDTO projectStructureDTO, string fileStructureId)
        {
            foreach (var item in projectStructureDTO.NestedFiles)
            {
                if (item.Id == fileStructureId)
                {
                    return item.Size;
                }
                int size = await GetFileStructureSize(item, fileStructureId);
                if(size!=0)
                {
                    return size;
                }
            }
            return 0;
        }

        public async Task UpdateAsync(ProjectStructureDTO projectStructureDTO)
        {
            var currentProjectStructureDto = await GetByIdAsync(projectStructureDTO.Id);
            currentProjectStructureDto.NestedFiles = projectStructureDTO.NestedFiles;

            var projectStructureUpdate = _mapper.Map<ProjectStructure>(currentProjectStructureDto);
            await _projectStructureRepository.UpdateAsync(projectStructureUpdate);
        }

        public async Task<ProjectStructureDTO> CreateAsync(ProjectStructureDTO projectStructureDto)
        {
            var projectStructureCreate = _mapper.Map<ProjectStructure>(projectStructureDto);
            var createdProjectStructure = await _projectStructureRepository.CreateAsync(projectStructureCreate);

            return await GetByIdAsync(createdProjectStructure.Id);
        }

        public async Task<ProjectStructureDTO> CreateEmptyAsync(int projectId, string projectName)
        {
            var emptyStructureDTO = new ProjectStructureDTO()
            {
                Id = projectId.ToString()
            };
            var initialFileStructure = new FileStructureDTO()
            {
                Type = TreeNodeType.Folder,
                Id = Guid.NewGuid().ToString(),
                Details = $"Super important details of file {projectName}",
                Name = projectName
            };
            emptyStructureDTO.NestedFiles.Add(initialFileStructure);

            var emptyStructure = _mapper.Map<ProjectStructure>(emptyStructureDTO);
            var createdProjectStructure = await _projectStructureRepository.CreateAsync(emptyStructure);
            return await GetByIdAsync(createdProjectStructure.Id);
        }

        public async Task ImportProject(string projectStructureId, IFormFile file, string fileStructureId, int userId, bool partial, string nodeids, bool loadFromGit = false)
        {
            string tempFolder = Path.Combine(Directory.GetCurrentDirectory(), "..\\Temp", Guid.NewGuid().ToString());
            var filesFolder = Path.Combine(tempFolder, file.FileName.Substring(0, file.FileName.LastIndexOf('.')));


            var projectStructure = _mapper.Map<ProjectStructureDTO>(await _projectStructureRepository.GetByIdAsync(projectStructureId));

            var rootFileStructure = projectStructure.NestedFiles.SingleOrDefault();

            if (partial)
            {
                var ids = JsonConvert.DeserializeObject<List<string>>(nodeids);

                rootFileStructure = projectStructure.NestedFiles.SingleOrDefault(u => u.Id == ids[0]);

                for (int i = 1; i < ids.Count(); i++)
                {
                    rootFileStructure = rootFileStructure.NestedFiles.SingleOrDefault(n => n.Id == ids[i]);
                }
            }
            else
            {
                rootFileStructure = projectStructure.NestedFiles.SingleOrDefault();
            }
            try
            {
                if (!Directory.Exists(tempFolder))
                {
                    Directory.CreateDirectory(tempFolder);
                }

                if (file.Length > 0)
                {
                    string fullPathToFile = Path.Combine(tempFolder, file.FileName);
                    using (var stream = new FileStream(fullPathToFile, FileMode.Create))
                    {
                        await file.CopyToAsync(stream).ConfigureAwait(false);
                    }

                    var pathToProject = UnzipProject(fullPathToFile, filesFolder);

                    await GetFilesRecursive(filesFolder, rootFileStructure, userId, Convert.ToInt32(projectStructureId)).ConfigureAwait(false);
                    if (loadFromGit)
                    {
                        rootFileStructure.NestedFiles = rootFileStructure.NestedFiles.ToArray()[0].NestedFiles;
                    }
                    var projectStructureDto = _mapper.Map<ProjectStructureDTO>(projectStructure);
                    await UpdateAsync(projectStructureDto);
                }
            }
            catch (Exception ex)
            {
                if (ex is TooHeavyFileException || ex is TooManyFilesInProjectException)
                    throw ex;

                Debug.WriteLine(ex.Message);
            }
            finally
            {
                if (Directory.Exists(tempFolder))
                {
                    Directory.Delete(tempFolder, true);
                }
            }
        }

        public async Task UnzipGitFileAsync(MemoryStream memoryStream, string pathToFile, string fileName)
        {
            //tempFolder + "\\ProjectFolder\\.git.zip"
            using (FileStream fs = new FileStream(pathToFile + "\\" + fileName, FileMode.OpenOrCreate))
            {
                await memoryStream.CopyToAsync(fs);
                await fs.FlushAsync();
                memoryStream.Close();
            }

            UnzipProject(pathToFile + "\\" + fileName, pathToFile);
            File.Delete(pathToFile + "\\" + fileName);
        }

        public void ZipGitFileAsync(string pathToFile, string projectId)
        {
            //ZipFile.CreateFromDirectory(pathToFile, pathToFile+".zip");
            using (var zip = new Ionic.Zip.ZipFile())
            {
                zip.AddDirectory(pathToFile + "\\ProjectFolder\\.git", ".git");
                zip.Save(pathToFile+$"\\ProjectFolder\\g{projectId}.zip");
            }
        }

        public async Task ProjectStructureForGit(string projectStructureId, string tempFolder)
        {
            var projectStructure = _mapper.Map<ProjectStructureDTO>(await _projectStructureRepository.GetByIdAsync(projectStructureId));

            if (!Directory.Exists(tempFolder))
            {
                Directory.CreateDirectory(tempFolder);
            }

            try
            {
                var fileStructure = await GetFolderNode(Convert.ToInt32(projectStructureId), "").ConfigureAwait(false);

                var filesId = GetListOfFilesId(fileStructure);

                var allFileInFileStructure = await _fileService.GetRangeByListOfIdAsync(filesId);

                await SaveFilesOnDisk(fileStructure, allFileInFileStructure, Path.Combine(tempFolder, "ProjectFolder")).ConfigureAwait(false);
            }
            catch (Exception exception)
            {
                if (Directory.Exists(tempFolder))
                {
                    Directory.Delete(tempFolder, true);
                }
                _logger.LogWarning(exception, exception.Message);
                throw exception;
            }
        }

        public async Task UpdateProjectStructureFromTempFolder(string projectStructureId, string tempFolder, int userId, bool isClone)
        {
            var projectStructure = _mapper.Map<ProjectStructureDTO>(await _projectStructureRepository.GetByIdAsync(projectStructureId));
            var rootFileStructure = projectStructure.NestedFiles.SingleOrDefault();

            await GetFilesRecursiveForGit(tempFolder, rootFileStructure, userId, Convert.ToInt32(projectStructureId), isClone);

            var projectStructureDto = _mapper.Map<ProjectStructure>(projectStructure);

            await _projectStructureRepository.UpdateAsync(projectStructureDto);
        }

        public async Task RemoveFilesBeforeCloneAsync(int projectId)
        {
            var projectStructure = _mapper.Map<ProjectStructureDTO>(await _projectStructureRepository.GetByIdAsync(projectId.ToString()));

            projectStructure.NestedFiles.SingleOrDefault().NestedFiles.Clear();

            var projectStructureDto = _mapper.Map<ProjectStructure>(projectStructure);
            await _projectStructureRepository.UpdateAsync(projectStructureDto);
        }

        private async Task GetFilesRecursiveForGit(string sourseDir, FileStructureDTO fileStructureRoot, int userId, int projectId, bool isClone)
        {
            try
            {   
                foreach (string directory in Directory.GetDirectories(sourseDir))
                {
                    var dirName = directory.Substring(directory.LastIndexOf('\\') + 1);

                    var tempDir = fileStructureRoot.NestedFiles.SingleOrDefault(n => n.Name == dirName);

                    //get temp libgit2sharp`s folder
                    string ff = "nothing";

                    if (isClone)
                    {
                        ff = Directory.GetDirectories(sourseDir)
                            .SingleOrDefault(d => d.Contains("_git2_"))
                            .Substring(directory.LastIndexOf('\\') + 1);
                    }                    

                    //Add directory to projectStructure 
                    if (tempDir == null && dirName != ".git" && dirName != ff)
                    {
                        var nestedFileStructure = new FileStructureDTO()
                        {
                            Type = TreeNodeType.Folder,
                            Name = dirName,
                            Id = Guid.NewGuid().ToString()
                        };

                        fileStructureRoot.NestedFiles.Add(nestedFileStructure);
                        await GetFilesRecursiveForGit(directory, nestedFileStructure, userId, projectId, isClone);
                    }
                }
                foreach (var file in Directory.GetFiles(sourseDir))
                {
                    var fileName = file.Substring(file.LastIndexOf('\\') + 1);
                    var dirName = sourseDir.Substring(sourseDir.LastIndexOf('\\') + 1);

                    Debug.WriteLine(dirName);

                    var tempFile = fileStructureRoot.NestedFiles.SingleOrDefault(n => n.Name == fileName);

                    if (tempFile == null && dirName != ".git")
                    {
                        var fileCreateDto = new FileCreateDTO();
                        fileCreateDto.Folder = dirName;
                        fileCreateDto.Name = fileName;
                        fileCreateDto.ProjectId = projectId;
                        fileCreateDto.Content = await GetFileContent(file);

                        var fileCreated = await _fileService.CreateAsync(fileCreateDto, userId);
                        var nestedFileStructure = new FileStructureDTO()
                        {
                            Type = TreeNodeType.File,
                            Name = fileName,
                            Id = fileCreated.Id,
                            Size = Encoding.Unicode.GetByteCount(fileCreated.Content)
                        };
                        fileStructureRoot.NestedFiles.Add(nestedFileStructure);

                    }
                    else if (tempFile != null && dirName != ".git")
                    {
                        var targetFile = await _fileService.GetByIdAsync(tempFile.Id);

                        targetFile.Content = await GetFileContent(file);
                        targetFile.UpdatedAt = DateTime.Now;
                        targetFile.UpdaterId = userId;

                        await _fileService.UpdateAsync(_mapper.Map<FileUpdateDTO>(targetFile), userId);
                    }
                }
            }
            catch(Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
        }

        public void DeleteTempFolder(string path)
        {
            try
            {
                File.SetAttributes(path, FileAttributes.Normal);

                string[] files = Directory.GetFiles(path);
                string[] directories = Directory.GetDirectories(path);

                foreach (var file in files)
                {
                    File.SetAttributes(file, FileAttributes.Normal);
                    File.Delete(file);
                }
                foreach (var directory in directories)
                {
                    DeleteTempFolder(directory);
                }

                Directory.Delete(path, false);
            }
            catch(Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
            
        }

        private async Task GetFilesRecursive(string sourseDir, FileStructureDTO fileStructureRoot, int userId, int projectId)
        {
            try
            {
                foreach (string directory in Directory.GetDirectories(sourseDir))
                {
                    var dirName = directory.Substring(directory.LastIndexOf('\\') + 1);

                    var nestedFileStructure = new FileStructureDTO()
                    {
                        Type = TreeNodeType.Folder,
                        Name = dirName,
                        Id = Guid.NewGuid().ToString()
                    };
                    fileStructureRoot.NestedFiles.Add(nestedFileStructure);
                    await GetFilesRecursive(directory, nestedFileStructure, userId, projectId);
                }
                foreach (var file in Directory.GetFiles(sourseDir))
                {
                    var fileName = file.Substring(file.LastIndexOf('\\') + 1);
                    var dirName = sourseDir.Substring(sourseDir.LastIndexOf('\\') + 1);

                    Debug.WriteLine(dirName);

                    var fileCreateDto = new FileCreateDTO();
                    fileCreateDto.Folder = dirName;
                    fileCreateDto.Name = fileName;
                    fileCreateDto.ProjectId = projectId;
                    fileCreateDto.Content = await GetFileContent(file);

                    var fileCreated = await _fileService.CreateAsync(fileCreateDto, userId);
                    var nestedFileStructure = new FileStructureDTO()
                    {
                        Type = TreeNodeType.File,
                        Name = fileName,
                        Id = fileCreated.Id,
                        Size = Encoding.Unicode.GetByteCount(fileCreated.Content)
                    };
                    fileStructureRoot.NestedFiles.Add(nestedFileStructure);
                }
            }
            catch (Exception e)
            {
                if (e is TooHeavyFileException || e is TooManyFilesInProjectException)
                    throw e;
                Debug.WriteLine(e.Message);
            }
        }

        private async Task<string> GetFileContent(string filepath)
        {
            string text;
            var fileStream = new FileStream(filepath, FileMode.Open, FileAccess.Read);
            using (var streamReader = new StreamReader(fileStream, Encoding.UTF8))
            {
                text = await streamReader.ReadToEndAsync().ConfigureAwait(false);
            }
            return text;
        }
        public  async Task<ProjectStructureDTO> CalculateProjectStructureSize(ProjectStructureDTO projectStructureDTO)
        {
            List<FileStructureDTO> rootfolder = new List<FileStructureDTO>();
            foreach (var item in projectStructureDTO.NestedFiles)
            {
                rootfolder.Add(await CalculateSize(item));
            }
            projectStructureDTO.NestedFiles = rootfolder;
            return projectStructureDTO;
        }

        private string UnzipProject(string pathToArchive, string destinationDirectoryPath)
        {
            ZipFile.ExtractToDirectory(pathToArchive, destinationDirectoryPath);

            var pathToProject = pathToArchive.Substring(0, pathToArchive.LastIndexOf('.'));
            return pathToProject;
        }

        public async Task<byte[]> CreateProjectZipFile(int projectId, string folderGuid = "")
        {
            var tempDir = _configuration.GetSection("TempDir").Value;
            var path = Path.Combine(tempDir, Guid.NewGuid().ToString());
            byte[] emptyAchive;
            using (var memoryStream = new MemoryStream())
            {
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                }
                emptyAchive = memoryStream.ToArray();
            }
            try
            {
                var fileStructure = await GetFolderNode(projectId, folderGuid).ConfigureAwait(false);

                if (fileStructure == null || fileStructure.NestedFiles.Count == 0)
                    return emptyAchive;

                var filesId = GetListOfFilesId(fileStructure);
                if (filesId.Count == 0)
                    return emptyAchive;

                var allFileInFileStructure = await _fileService.GetRangeByListOfIdAsync(filesId);

                await SaveFilesOnDisk(fileStructure, allFileInFileStructure, Path.Combine(path, "ProjectFolder")).ConfigureAwait(false);
                ZipFile.CreateFromDirectory(Path.Combine(path, "ProjectFolder"), Path.Combine(path, $"{projectId}.zip"));

                var fileByteArray = await File.ReadAllBytesAsync(Path.Combine(path, $"{projectId}.zip")).ConfigureAwait(false);
                return fileByteArray;
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, exception.Message);
                throw exception;
            }
            finally
            {
                if (Directory.Exists(path))
                {
                    Directory.Delete(path, true);
                }
            }
        }

        private async Task SaveFilesOnDisk(FileStructureDTO fileStructure, IDictionary<string, FileDTO> allFileInFileStructure, string path)
        {
            foreach (var node in fileStructure.NestedFiles)
            {
                if (node.Type == TreeNodeType.File)
                {

                    var hasFile = allFileInFileStructure.TryGetValue(node.Id, out var file);
                    if (!hasFile)
                        continue;

                    Directory.CreateDirectory(path);
                    using (StreamWriter streamWriter = File.CreateText(Path.Combine(path, file.Name)))
                    {
                        await streamWriter.WriteAsync(file.Content).ConfigureAwait(false);
                    }
                }
                else
                {
                    await SaveFilesOnDisk(node, allFileInFileStructure, Path.Combine(path, node.Name)).ConfigureAwait(false);
                }
            }
        }

        private ICollection<string> GetListOfFilesId(FileStructureDTO fileStructure)
        {
            var filesId = new List<string>();

            var queue = new Queue<FileStructureDTO>(fileStructure.NestedFiles);

            while (queue.Count > 0)
            {
                var node = queue.Dequeue();

                if (node.Type == TreeNodeType.File)
                {
                    filesId.Add(node.Id);
                    continue;
                }
                foreach (var subFolder in node.NestedFiles)
                {
                     queue.Enqueue(subFolder);
                }
            }
            return filesId;
        }

        private async Task<FileStructureDTO> GetFolderNode(int projectId, string folderGuid)
        {
            var projectStructure = await GetByIdAsync(projectId.ToString()).ConfigureAwait(false);

            if (string.IsNullOrEmpty(folderGuid))
                return projectStructure.NestedFiles.FirstOrDefault();

            var queue = new Queue<FileStructureDTO>(projectStructure.NestedFiles);

            while (queue.Count > 0)
            {
                var folder = queue.Dequeue();

                if (folder.Id == folderGuid)
                    return folder;

                foreach (var subFolder in folder.NestedFiles)
                {
                    if (subFolder.Type == TreeNodeType.Folder)
                        queue.Enqueue(subFolder);
                }
            }
            return null;
        }

        private async Task<FileStructureDTO> CalculateSize(FileStructureDTO projectStructureDTO)
        {
            foreach (var item in projectStructureDTO.NestedFiles)
            {
                if (item.Type == 0)
                {
                    item.Size = (await CalculateSize(item)).Size;
                }
                else
                {
                    item.Size = await _fileService.GetFileSize(item.Id);
                }
                projectStructureDTO.Size += item.Size;
            }

            return projectStructureDTO;
        }
    }
}
