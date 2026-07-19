using Ecommerce.API.Authorization;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[HasPermission(Permissions.ManageSettings)]
[ApiController]
[Route("api/v1/admin/email-templates")]
[Produces("application/json")]
public class EmailTemplatesController : ControllerBase
{
    private readonly IEmailTemplateService _templates;

    public EmailTemplatesController(IEmailTemplateService templates) => _templates = templates;

    [HttpGet("{key}")]
    [ProducesResponseType(typeof(EmailTemplateDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmailTemplateDto>> Get(string key, CancellationToken ct)
        => Ok(await _templates.GetAsync(key, ct));

    [HttpPut("{key}")]
    [ProducesResponseType(typeof(EmailTemplateDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmailTemplateDto>> Update(string key, UpdateEmailTemplateRequest request, CancellationToken ct)
        => Ok(await _templates.UpdateAsync(key, request, ct));

    [HttpPost("{key}/reset")]
    [ProducesResponseType(typeof(EmailTemplateDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmailTemplateDto>> Reset(string key, CancellationToken ct)
        => Ok(await _templates.ResetToDefaultAsync(key, ct));
}
