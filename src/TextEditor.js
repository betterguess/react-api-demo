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

  const getCurrentWord = (text) => {
    const words = text.split(/\s+/);
    return words[words.length - 1] || "";
  };

  const matchCase = (suggestion, wordToReplace) => {
    if (wordToReplace && wordToReplace[0] === wordToReplace[0].toUpperCase()) {
      return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
    } else {
      return suggestion.toLowerCase();
    }
  };

  useEffect(() => {
    if (text) {
      const prompt = text.slice(0, cursorPosition);
  
      const fetchSuggestions = async (prompt) => {
        try {
          console.info('Entering predictions');
          const uri = 'https://cloudapidemo.azurewebsites.net/continuations'; // Remote, hosted on Azure
          // const uri = 'http://127.0.0.1:8080/continuations'; // Local, running from IDEA
          const response = await axios.post(uri, {
            locale: "en_US",
            prompt: prompt
          });
          const currentWord = getCurrentWord(prompt);
          const processedSuggestions = response.data.continuations.map(suggestion => 
            matchCase(suggestion, currentWord)
          );
          setSuggestions(processedSuggestions);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      };
  
      fetchSuggestions(prompt);
    }
  }, [text, cursorPosition]);


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
      x: caret.left + textareaRect.left + window.scrollX, // Added textareaRect.left for horizontal alignment
      y: caret.top + textareaRect.top + window.scrollY + 24 // Added textareaRect.top for vertical alignment
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