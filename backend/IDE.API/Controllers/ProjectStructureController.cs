﻿using IDE.API.Extensions;
using IDE.BLL.Services;
using IDE.Common.ModelsDTO.DTO.Workspace;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IDE.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ProjectStructureController : ControllerBase
    {
        private readonly ProjectStructureService _projectStructureService;
        private readonly ILogger<ProjectStructureController> _logger;
        public ProjectStructureController(ProjectStructureService projectStructureService, ILogger<ProjectStructureController> logger)
        {
            _projectStructureService = projectStructureService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] ProjectStructureDTO projectStructureDTO)
        {
            
              var createdProjectStructure = await _projectStructureService.CreateAsync(projectStructureDTO);
            _logger.LogInformation("created project structure");
            return CreatedAtAction(nameof(GetByIdAsync), new { id = createdProjectStructure.Id }, createdProjectStructure);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateAsync([FromBody] ProjectStructureDTO projectStructureDTO)
        {
            projectStructureDTO=await _projectStructureService.CalculateProjectStructureSize(projectStructureDTO);
            await _projectStructureService.UpdateAsync(projectStructureDTO);
            _logger.LogInformation("updated project structure");
            return NoContent();
        }

        [HttpGet("size/{projectStructureId}/{fileStructureId}")]
        public async Task<ActionResult<int>> GetFileStructureSize(string projectStructureId, string fileStructureId)
        {
            return Ok(await GetSize(projectStructureId, fileStructureId));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectStructureDTO>> GetByIdAsync(string id)
        {
            return Ok(await _projectStructureService.GetByIdAsync(id));
        }

        private async Task<int> GetSize(string projectStructureId, string fileStructureId )
        {
            var projectStructure = await _projectStructureService.GetByIdAsync(projectStructureId);
            await _projectStructureService.CalculateProjectStructureSize(projectStructure);
            foreach (var item in projectStructure.NestedFiles)
            {
                if (fileStructureId==item.Id)
                {
                    return item.Size;
                }
                    return await _projectStructureService.GetFileStructureSize(item, fileStructureId);
            }
            return 0;
        }

        [HttpPost("import")]
        public async Task ImportFile([FromForm] ImportProjectDTO importProjectDTO)
        {
            var author = this.GetUserIdFromToken();
            await _projectStructureService.ImportProject(
                importProjectDTO.projectStructureId,
                Request.Form.Files[0],
                importProjectDTO.fileStructureId,
                author, true,
               importProjectDTO.ParentNodeIds);
        }
    }
}