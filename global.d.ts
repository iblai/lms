interface Window {
  __ENV__: { [key: string]: string | undefined }; // Define the structure of __ENV__
}

declare namespace JSX {
  interface IntrinsicElements {
    'agent-ai': any; // You can replace 'any' with a more specific type if you have one
  }
}
