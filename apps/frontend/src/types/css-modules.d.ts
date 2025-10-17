declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module 'react-qr-scanner' {
  import { Component } from 'react';

  interface QrScannerProps {
    delay?: number;
    onError?: (error: Error) => void;
    onScan?: (data: { text: string } | null) => void;
    style?: React.CSSProperties;
    constraints?: MediaStreamConstraints;
    facingMode?: 'user' | 'environment';
    legacyMode?: boolean;
    showViewFinder?: boolean;
    className?: string;
  }

  export default class QrScanner extends Component<QrScannerProps> {}
}