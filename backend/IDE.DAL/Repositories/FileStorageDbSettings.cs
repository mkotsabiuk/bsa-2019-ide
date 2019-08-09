﻿using IDE.DAL.Interfaces;

namespace IDE.DAL.Repositories
{
    public class FileStorageDbSettings : IFileStorageDbSettings
    {
        public string ConnectionString { get; set; }
        public string DatabaseName { get; set; }
    }
}