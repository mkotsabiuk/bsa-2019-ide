﻿using IDE.Common.ModelsDTO.Enums;
using System.Collections.Generic;

namespace IDE.Common.ModelsDTO.DTO.Workspace
{
    public class FileStructureDTO
    {
        public FileStructureDTO()
        {
            NestedFiles = new List<FileStructureDTO> ();
        }
        public string Id { get; set; }
        public TreeNodeType Type { get; set; }
        public bool IsOpened { get; set; }
        public string Name { get; set; }
        public int Size { get; set; }
        public string Details { get; set; }
        public ICollection<FileStructureDTO> NestedFiles { get; set; }
    }
}
