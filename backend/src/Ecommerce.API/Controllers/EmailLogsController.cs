using Ecommerce.API.Authorization;
using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[HasPermission(Permissions.ManageSettings)]
[ApiController]
[Route("api/v1/admin/email-logs")]
[Produces("application/json")]
public class EmailLogsController : ControllerBase
{
    private readonly IEmailLogService _logs;

    public EmailLogsController(IEmailLogService logs) => _logs = logs;

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<EmailLogListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<EmailLogListItemDto>>> List(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => Ok(await _logs.GetAsync(page, pageSize, ct));

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(EmailLogDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmailLogDto>> Get(int id, CancellationToken ct)
        => Ok(await _logs.GetByIdAsync(id, ct));
}
