# Checklist antes do uso institucional

- [ ] Implementar backend e autenticação real no servidor.
- [ ] Garantir que nenhuma informação sensível seja protegida apenas por JavaScript ou localStorage.
- [ ] Definir perfis de acesso e permissões no servidor.
- [ ] Remover dados demonstrativos e testar com dados fictícios.
- [ ] Definir backups, recuperação, logs e política de retenção.
- [ ] Revisar LGPD e procedimentos de acesso aos dados de residentes.
- [ ] Testar em diferentes tamanhos de tela e versões Android.
- [ ] Gerar APK assinado e guardar a chave de assinatura com segurança.
- [ ] Substituir a autenticação local de demonstração por autenticação no servidor.
- [ ] Remover credenciais administrativas embutidas no JavaScript e usar gestão segura de segredos.
- [ ] Persistir usuários em banco de dados central com e-mail único imposto também por restrição no banco.
- [ ] Validar todas as permissões no backend; ocultar botões no frontend não é uma barreira de segurança.
- [ ] Não armazenar dados reais de residentes no localStorage do dispositivo.
