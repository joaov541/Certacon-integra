const api = "https://172.16.1.185:7249";

export default api;


fetch(`${api}/api/autenticação/login`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        identificador: cnpj.trim(),
        senha: senha
    })
});