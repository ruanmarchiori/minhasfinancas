/* Configuração do Sistema Financeiro.

   Os dados ficam no navegador (localStorage) — roda de graça no GitHub Pages, sem servidor.
   Limitação: cada navegador/aparelho tem os próprios dados (celular ≠ computador); use
   Configurações → Backup para levar de um aparelho para outro.

   Conta de acesso: só serve pra impedir uso casual por quem tem o link — como o site é
   estático, quem sabe mexer em código consegue contornar. Senha inicial: "trocar123" —
   troque pelo menu Configurações (a troca vale só no navegador em que foi feita). Pra mudar
   a senha aqui no código: abra login.html, aperte F12 e rode  await hashPassword("nova")
   e cole o resultado abaixo. */
window.APP_CONFIG = {
  mode: 'local',
  localAuth: {
    email: 'ruancardozo97@hotmail.com',
    passwordHash: 'b0857a7c7d3178e44ca0d8836786ae18ee806f7625e589b98c5bad307813eaf6'
  }
};
