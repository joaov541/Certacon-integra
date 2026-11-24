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

// =========================================
// CONTROLLERS
// =========================================

builder.Services.AddControllers();

// =========================================
// CORS - FRONTEND REACT
// =========================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// =========================================
// SWAGGER
// =========================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
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
            [new OpenApiSecuritySchemeReference(
                "Bearer",
                document
            )] = new List<string>()
        });
});

// =========================================
// BANCO DE DADOS
// =========================================

builder.Services.AddDbContext<IntegraCertaconContext>(
    options => options.UseSqlServer(
        builder.Configuration.GetConnectionString(
            "ConexaoIntegra"
        )
    )
);

// =========================================
// SERVIÇOS DA APLICAÇÃO
// =========================================

builder.Services.AddScoped<ArmazenamentoXmlService>();
builder.Services.AddScoped<ValidacaoCnpjService>();
builder.Services.AddScoped<ValidacaoNfeService>();
builder.Services.AddScoped<AuditoriaService>();
builder.Services.AddScoped<PermissaoService>();
builder.Services.AddSingleton<LimiteConsultaChavesService>();
builder.Services.AddScoped<SimuladorTributarioService>();

// =========================================
// PROTEÇÃO DE SENHAS
// =========================================

builder.Services.AddScoped<
    IPasswordHasher<Usuario>,
    PasswordHasher<Usuario>
>();

// =========================================
// AUTENTICAÇÃO JWT
// =========================================

var chave = builder.Configuration["Jwt:Chave"]
    ?? throw new Exception(
        "A chave JWT não foi configurada."
    );

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,

                ValidIssuer =
                    builder.Configuration["Jwt:Emissor"],

                ValidateAudience = true,

                ValidAudience =
                    builder.Configuration["Jwt:Audiencia"],

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(chave)
                    )
            };
    });

// =========================================
// AUTORIZAÇÃO
// =========================================

builder.Services.AddAuthorization();

// =========================================
// CONSTRUÇÃO DA APLICAÇÃO
// =========================================

var app = builder.Build();


// =========================================
// SWAGGER - DESENVOLVIMENTO
// =========================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// =========================================
// MIDDLEWARES
// =========================================

app.UseHttpsRedirection();

app.UseCors("PermitirFrontend");

app.UseAuthentication();

app.UseAuthorization();

// =========================================
// ROTAS
// =========================================

app.MapControllers();

app.Run();