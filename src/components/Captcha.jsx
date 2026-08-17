import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha';

const SITE_KEY = 'c4d4fe34-7d4e-45b2-80fa-c73a45d6cdcc';

const Captcha = forwardRef(function Captcha({ onVerify, onError }, ref) {
  const captchaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    execute: () => captchaRef.current?.show(),
  }));

  const handleMessage = (event) => {
    if (!event?.nativeEvent?.data) return;

    if (event.success) {
      const token = event.nativeEvent.data;
      event.markUsed?.();
      captchaRef.current?.hide();
      onVerify?.(token);
      return;
    }

    captchaRef.current?.hide();
    if (event.nativeEvent.data !== 'open') {
      onError?.(event.nativeEvent.data);
    }
  };

  return (
    <ConfirmHcaptcha
      ref={captchaRef}
      siteKey={SITE_KEY}
      baseUrl="https://hcaptcha.com"
      onMessage={handleMessage}
    />
  );
});

export default Captcha;
