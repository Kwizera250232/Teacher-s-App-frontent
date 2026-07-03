import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMPOSITION_TOPICS, getTopicsByCategory } from '../utils/compositionTopics';
import './TopicSlider.css';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '✨' },
  { key: 'careers', label: 'Careers', icon: '💼' },
  { key: 'values', label: 'Values', icon: '🤝' },
  { key: 'places', label: 'Rwanda', icon: '🏔️' },
  { key: 'subjects', label: 'Subjects', icon: '📚' },
];

const SLIDE_INTERVAL = 5000; // 5 seconds

export default function TopicSlider({ onSelectTopic, compact = false, onWriteClick }) {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const topics = getTopicsByCategory(category);
  const currentTopic = topics[index] || topics[0];

  const nextSlide = useCallback(() => {
    setIndex(prev => (prev + 1) % topics.length);
  }, [topics.length]);

  const prevSlide = useCallback(() => {
    setIndex(prev => (prev - 1 + topics.length) % topics.length);
  }, [topics.length]);

  useEffect(() => {
    setIndex(0);
  }, [category]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(nextSlide, SLIDE_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [nextSlide, paused, category]);

  const handleStartWriting = () => {
    if (onWriteClick) {
      onWriteClick(currentTopic);
      return;
    }
    if (onSelectTopic) {
      onSelectTopic(currentTopic);
    } else {
      navigate('/alumni/compose', { state: { presetTopic: currentTopic } });
    }
  };

  if (compact) {
    return (
      <div className="ts-inline" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <button className="ts-inline-nav" onClick={prevSlide} aria-label="Previous topic">‹</button>
        <div className="ts-inline-track">
          <span className="ts-inline-text" title={currentTopic}>{currentTopic}</span>
        </div>
        <button className="ts-inline-write" onClick={handleStartWriting}>✍️ Start</button>
        <button className="ts-inline-nav" onClick={nextSlide} aria-label="Next topic">›</button>
      </div>
    );
  }

  return (
    <div className="ts-container" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="ts-header">
        <div className="ts-title-row">
          <span className="ts-icon">🎨</span>
          <h3 className="ts-title">Composition Topics</h3>
          <span className="ts-count">{COMPOSITION_TOPICS.length}+ topics</span>
        </div>
        <div className="ts-categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`ts-cat ${category === cat.key ? 'ts-cat-active' : ''}`}
              onClick={() => setCategory(cat.key)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ts-slider">
        <button className="ts-nav ts-nav-prev" onClick={prevSlide} aria-label="Previous topic">‹</button>
        <div className="ts-slide">
          <div className="ts-slide-number">#{index + 1}</div>
          <p className="ts-topic-text">{currentTopic}</p>
          <button className="ts-write-btn" onClick={handleStartWriting}>
            ✍️ Start Writing
          </button>
        </div>
        <button className="ts-nav ts-nav-next" onClick={nextSlide} aria-label="Next topic">›</button>
      </div>

      <div className="ts-progress">
        <div className="ts-progress-bar" style={{ width: `${((index + 1) / topics.length) * 100}%` }} />
      </div>

      <div className="ts-dots">
        {topics.slice(0, 20).map((_, i) => (
          <button
            key={i}
            className={`ts-dot ${i === index % 20 ? 'ts-dot-active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to topic ${i + 1}`}
          />
        ))}
        {topics.length > 20 && <span className="ts-dots-more">+{topics.length - 20}</span>}
      </div>
    </div>
  );
}
