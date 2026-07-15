using System.Text.Json;
using Ecommerce.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Middleware;

/// <summary>Converts unhandled exceptions into RFC7807 ProblemDetails responses.</summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception ex)
    {
        var (status, title) = ex switch
        {
            AppException appEx => (appEx.StatusCode, appEx.Message),
            OperationCanceledException => (499, "Request cancelled."),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.")
        };

        if (status >= 500)
            _logger.LogError(ex, "Unhandled exception");
        else
            _logger.LogWarning("Handled application error: {Message}", ex.Message);

        if (context.Response.HasStarted)
            return;

        var problem = new ProblemDetails
        {
            Status = status,
            Title = ex is AppException ? title : "An unexpected error occurred.",
            Type = $"https://httpstatuses.io/{status}",
            Instance = context.Request.Path
        };

        if (_env.IsDevelopment() && ex is not AppException)
            problem.Detail = ex.ToString();

        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(problem,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
