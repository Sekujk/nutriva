import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const SITE_KEY = 'c4d4fe34-7d4e-45b2-80fa-c73a45d6cdcc';

const Captcha = forwardRef(function Captcha({ onVerify, onError }, ref) {
  const captchaRef = useRef(null);
  // El script de hCaptcha carga async: si execute() se llama antes de que
  // termine, no pasa nada (ni onVerify ni onError) y el login se queda
  // colgado hasta que se reintenta. Se guarda el intento y se dispara solo
  // cuando el script ya está listo, en vez de dejar que falle la primera vez.
  const readyRef = useRef(false);
  const pendingRef = useRef(false);
  const timeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    execute: () => {
      if (readyRef.current) {
        captchaRef.current?.execute();
        return;
      }
      pendingRef.current = true;
      // Si el script no llega a cargar (red lenta, bloqueador de anuncios,
      // hCaptcha caído), no dejar la promesa colgada para siempre.
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (pendingRef.current) {
          pendingRef.current = false;
          onError?.('script-not-loaded');
        }
      }, 10000);
    },
  }));

  return (
    <HCaptcha
      ref={captchaRef}
      sitekey={SITE_KEY}
      size="invisible"
      onVerify={onVerify}
      onError={onError}
      onExpire={() => onError?.('expired')}
      onLoad={() => {
        readyRef.current = true;
        clearTimeout(timeoutRef.current);
        if (pendingRef.current) {
          pendingRef.current = false;
          captchaRef.current?.execute();
        }
      }}
    />
  );
});

export default Captcha;
