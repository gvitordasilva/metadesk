

## Correção do reCAPTCHA que Não Aparece

### Causa do Problema

O log de erro mostra:
```
reCAPTCHA couldn't find user-provided function: onRecaptchaLoad
```

Isso acontece porque:
1. O script do reCAPTCHA carrega e imediatamente tenta chamar `window.onRecaptchaLoad`
2. Mas o componente React ainda não teve tempo de definir essa função
3. Quando há navegação entre steps do formulário, o componente é remontado, mas o script já existe no DOM

### Solução

Modificar a lógica de carregamento do reCAPTCHA para:

1. **Definir o callback ANTES de verificar se o script existe** - garantindo que `window.onRecaptchaLoad` sempre esteja disponível
2. **Tratar o caso onde o grecaptcha já está carregado** - chamando `renderWidget()` imediatamente
3. **Evitar múltiplas renderizações do widget** - verificando corretamente se já foi renderizado

### Alterações no Arquivo

**Arquivo:** `src/components/complaints/StepConfirmation.tsx`

#### Mudança 1: Definir callback antes de tudo

O callback `window.onRecaptchaLoad` precisa ser definido **antes** de qualquer verificação do script, para garantir que esteja disponível quando o reCAPTCHA tentar chamá-lo.

#### Mudança 2: Verificar se grecaptcha.render está disponível

Adicionar verificação para quando o `window.grecaptcha` já existe mas o widget ainda não foi renderizado.

#### Mudança 3: Melhorar cleanup para evitar state stale

Usar uma flag `isMounted` para evitar updates de state após o componente ser desmontado.

### Código Modificado

```typescript
useEffect(() => {
  let isMounted = true;

  const renderWidget = () => {
    if (!isMounted) return;
    if (!recaptchaContainerRef.current) return;
    if (widgetIdRef.current !== null) return;
    
    try {
      widgetIdRef.current = window.grecaptcha.render(recaptchaContainerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token: string) => {
          if (isMounted) {
            console.log("reCAPTCHA verified successfully");
            setRecaptchaError(null);
            onCaptchaChange(token);
          }
        },
        "expired-callback": () => {
          if (isMounted) {
            console.log("reCAPTCHA expired");
            onCaptchaChange(null);
            setRecaptchaError("Verificação expirou. Por favor, marque o checkbox novamente.");
          }
        },
        "error-callback": () => {
          if (isMounted) {
            console.error("reCAPTCHA error");
            onCaptchaChange(null);
            setRecaptchaError("Erro na verificação. Por favor, tente novamente.");
          }
        },
        theme: "light",
        size: "normal"
      });
      if (isMounted) {
        setIsRecaptchaReady(true);
      }
    } catch (error) {
      console.error("Error rendering reCAPTCHA:", error);
      if (isMounted) {
        setRecaptchaError("Erro ao inicializar reCAPTCHA. Por favor, recarregue a página.");
      }
    }
  };

  // Define callback FIRST (before any checks)
  window.onRecaptchaLoad = () => {
    renderWidget();
  };

  // Check if grecaptcha is already loaded and ready
  if (window.grecaptcha && window.grecaptcha.render) {
    renderWidget();
    return () => {
      isMounted = false;
    };
  }

  // Check if script already exists but grecaptcha not ready yet
  const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
  if (existingScript) {
    // Script exists, just wait for onRecaptchaLoad callback
    return () => {
      isMounted = false;
    };
  }

  // Load script for first time
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
  script.async = true;
  script.defer = true;
  
  script.onerror = () => {
    console.error("Failed to load reCAPTCHA script");
    if (isMounted) {
      setRecaptchaError("Erro ao carregar reCAPTCHA. Por favor, recarregue a página.");
    }
  };
  
  document.head.appendChild(script);

  return () => {
    isMounted = false;
  };
}, [onCaptchaChange]);
```

### Resultado Esperado

Após a correção:
- O widget "Não sou um robô" aparecerá normalmente na etapa de confirmação
- Funciona corretamente mesmo se o usuário navegar entre steps
- Funciona corretamente após refresh da página
- Não haverá mais o erro "couldn't find user-provided function"

