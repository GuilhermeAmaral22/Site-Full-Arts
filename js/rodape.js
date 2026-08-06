function configurarRodape() {
  const ano = document.getElementById("ano");
  const whatsapp = document.getElementById("whatsapp-footer");
  const instagram = document.getElementById("instagram-link");

  if (ano) ano.textContent = new Date().getFullYear();
  if (whatsapp) whatsapp.href = `https://wa.me/${WHATSAPP_NUMERO}`;
  if (instagram) {
    instagram.href = `https://instagram.com/${INSTAGRAM_USUARIO}`;
    instagram.textContent = `@${INSTAGRAM_USUARIO}`;
  }
}
