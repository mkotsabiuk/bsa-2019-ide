﻿using IDE.Common.DTO.User;
using System;
using System.Collections.Generic;
using System.Text;

namespace IDE.Common.DTO.File
{
    public class FileHistoryDTO
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public int UpdaterId { get; set; }
        public UserDTO Updater { get; set; }
    }
}