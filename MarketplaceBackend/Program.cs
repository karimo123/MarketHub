using Microsoft.EntityFrameworkCore;
using MarketplaceBackend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;  


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
       policy =>
        {
            policy.WithOrigins(
                builder.Configuration.GetValue<string>("FrontendUrl") ?? "http://localhost:4200"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
        });
});

builder.Services.AddDbContext<MarketplaceContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {

        var signingKey = builder.Configuration.GetValue<string>("JwtSigningKey");
        if (string.IsNullOrEmpty(signingKey))
        {
            throw new Exception("JWT Signing Key is missing");
        }


        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = builder.Configuration.GetValue<string>("Supabase:ApiUrl"),
            ValidateIssuer = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
            ValidAudience = "authenticated",
            ValidateAudience = true,
            ValidateLifetime = true
        };

        options.RequireHttpsMetadata = false;
    });


var app = builder.Build();

app.UseCors("AllowAngularApp");

// Configure middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
