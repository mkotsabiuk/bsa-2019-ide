﻿using IDE.API.Extensions;
using IDE.BLL.Interfaces;
using IDE.Common.Enums;
using IDE.Common.ModelsDTO.DTO.Common;
using IDE.Common.ModelsDTO.DTO.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;


namespace IDE.API.Controllers
{
    [Route("[controller]")]
    [Authorize]
    [ApiController]
    public class RightsController : ControllerBase
    {
        private readonly IRightsService _rightsService;
        private readonly ILogger<RightsController> _logger;
        public RightsController(IRightsService rightsService, ILogger<RightsController> logger)
        {
            _rightsService = rightsService;
            _logger = logger;
        }

        [HttpPut]
        public async Task<IActionResult> SetRights([FromBody] UpdateUserRightDTO update)
        {
            await _rightsService.SetRightsToProject(update, this.GetUserIdFromToken());
            return Ok();
        }

        [HttpGet("{userId}/{projectId}")]
        public async Task<IActionResult> GetUserRightById(int userId, int projectId)
        {
            return Ok(await _rightsService.GetUserRightById(userId, projectId));
        }

        [HttpDelete("{userId}/{projectId}")]
        public async Task<IActionResult> DeleteRights(int userId, int projectId)
        {
            await _rightsService.DeleteRights(userId, projectId, this.GetUserIdFromToken());
            return Ok();
        }

        [HttpGet("{projectId}")]
        public IActionResult GetRights(int projectId)
        {
            return Ok(_rightsService.GetUserRightsForProject(projectId, this.GetUserIdFromToken()));
        }
    }
}