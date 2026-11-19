import '../styles/Loader.css';

export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="loader">
      <div className="loader__spinner">
        <div className="loader__ring"></div>
        <div className="loader__ring"></div>
        <div className="loader__ring"></div>
      </div>
      <p className="loader__text">{text}</p>
    </div>
  );
}
