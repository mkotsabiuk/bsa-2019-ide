﻿using IDE.DAL.Entities.Elastic.Abstract;
using Nest;

namespace IDE.DAL.Entities.Elastic
{
    public class FileSearch : BaseSearchDocument
    {
        [Text(Name = "name")]
        public string Name { get; set; }

        //[Text(Name = "content", TermVector = TermVectorOption.WithPositionsOffsets)]
        [Text(Name = "content")]
        public string Content { get; set; }

        [Text(Name = "folder")]
        public string Folder { get; set; }

        [Text(Name = "projectId")]
        public int ProjectId { get; set; }
    }
}
