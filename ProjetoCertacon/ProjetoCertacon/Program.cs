using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;
using System.Text;
using ProjetoCertacon.Services;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<ArmazenamentoXmlService>();
builder.Services.AddScoped<ValidacaoNfeService>();
builder.Services.AddScoped<AuditoriaService>();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Cole seu token JWT aqui."
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] =
                new List<string>()
        });
});

builder.Services.AddDbContext<IntegraCertaconContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("ConexaoIntegra")));

// Configuração do JWT
var chave = builder.Configuration["Jwt:Chave"]
    ?? throw new Exception("A chave JWT não foi configurada.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Emissor"],

            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audiencia"],

            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(chave))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
