// src/TextEditor.js

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import getCaretCoordinates from 'textarea-caret';
import './TextEditor.css';

const TextEditor = () => {
  const [text, setText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const textareaRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async (prompt) => {
      try {
        const response = await axios.post('https://cloudapidemo.azurewebsites.net/continuations', {
          locale: "en_US",
          prompt: prompt
        });
        setSuggestions(response.data.continuations || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    if (text) {
      const prompt = text.slice(0, cursorPosition);
      fetchSuggestions(prompt);
    }
  }, [text, cursorPosition]);  // fetchSuggestions is defined within useEffect and doesn't need to be a dependency

  const handleChange = (event) => {
    setText(event.target.value);
    setCursorPosition(event.target.selectionStart);
    updateCursorPosition(event.target, event.target.selectionStart);
  };

  const handleSelect = (event) => {
    setCursorPosition(event.target.selectionStart);
    updateCursorPosition(event.target, event.target.selectionStart);
  };

  const handleSuggestionClick = (suggestion) => {
    const words = text.split(/\s+/);
    const cursorWordIndex = text.slice(0, cursorPosition).split(/\s+/).length - 1;
    words[cursorWordIndex] = suggestion + ' '; // Add space after suggestion
    const newText = words.join(' ');
    const newCursorPosition = newText.length;

    setText(newText);
    setCursorPosition(newCursorPosition);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const updateCursorPosition = (textarea, position) => {
    const caret = getCaretCoordinates(textarea, position);
    const textareaRect = textarea.getBoundingClientRect();
    setCoords({
      x: caret.left + textareaRect.left + window.scrollX,
      y: caret.top + textareaRect.top + window.scrollY + 24 // assuming 24px roughly equals the height of one line
    });
  };

  return (
    <div className="app-container">
      <header>
        <h1>Word Prediction API Demo</h1>
      </header>
      <div className="text-editor-container">
        <textarea 
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onSelect={handleSelect}
          placeholder="Type your text here..."
        />
        {suggestions.length > 0 && (
          <ul className="suggestions" style={{ left: `${coords.x}px`, top: `${coords.y}px` }}>
            {suggestions.map((suggestion, index) => (
              <li key={index} className="suggestion" onClick={() => handleSuggestionClick(suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TextEditor;