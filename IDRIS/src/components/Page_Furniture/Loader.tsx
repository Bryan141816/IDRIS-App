// components/TempLoader.tsx
import "./styles/Loader.scss"; // optional styles

export default function PageLoader() {
  return (
    <div className="temp-loader">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
}
