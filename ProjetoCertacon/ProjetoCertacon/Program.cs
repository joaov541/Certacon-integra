using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();

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

// Banco de dados
builder.Services.AddDbContext<IntegraCertaconContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("ConexaoIntegra")));

// Serviços da aplicação
builder.Services.AddScoped<ArmazenamentoXmlService>();
builder.Services.AddScoped<ValidacaoNfeService>();
builder.Services.AddScoped<AuditoriaService>();

// Senhas
builder.Services.AddScoped<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();

// JWT
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

var app = builder.Build();

// Swagger no ambiente de desenvolvimento
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Middlewares
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// Rotas
app.MapControllers();

app.Run();