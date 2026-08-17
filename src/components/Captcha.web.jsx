import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const SITE_KEY = 'c4d4fe34-7d4e-45b2-80fa-c73a45d6cdcc';

const Captcha = forwardRef(function Captcha({ onVerify, onError }, ref) {
  const captchaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    execute: () => captchaRef.current?.execute(),
  }));

  return (
    <HCaptcha
      ref={captchaRef}
      sitekey={SITE_KEY}
      size="invisible"
      onVerify={onVerify}
      onError={onError}
      onExpire={() => onError?.('expired')}
    />
  );
});

export default Captcha;
