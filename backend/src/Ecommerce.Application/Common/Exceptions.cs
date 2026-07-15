namespace Ecommerce.Application.Common;

/// <summary>Base for domain/application errors that map to specific HTTP status codes.</summary>
public abstract class AppException : Exception
{
    protected AppException(string message) : base(message) { }
    public abstract int StatusCode { get; }
}

/// <summary>404 – resource not found.</summary>
public sealed class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message) { }
    public NotFoundException(string entity, object key) : base($"{entity} '{key}' was not found.") { }
    public override int StatusCode => 404;
}

/// <summary>409 – conflict (e.g. duplicate slug/email, already reviewed).</summary>
public sealed class ConflictException : AppException
{
    public ConflictException(string message) : base(message) { }
    public override int StatusCode => 409;
}

/// <summary>400 – business-rule violation not covered by input validation.</summary>
public sealed class BadRequestException : AppException
{
    public BadRequestException(string message) : base(message) { }
    public override int StatusCode => 400;
}

/// <summary>401 – authentication failed.</summary>
public sealed class UnauthorizedException : AppException
{
    public UnauthorizedException(string message) : base(message) { }
    public override int StatusCode => 401;
}

/// <summary>403 – authenticated but not allowed.</summary>
public sealed class ForbiddenException : AppException
{
    public ForbiddenException(string message) : base(message) { }
    public override int StatusCode => 403;
}
