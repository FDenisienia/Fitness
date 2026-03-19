import React, { useState, useRef, useEffect } from 'react';

/**
 * Autocomplete para seleccionar ejercicios de la biblioteca o cargar manualmente.
 * - Busca en biblioteca por nombre
 * - Al seleccionar: autocompleta datos (nombre, video, grupo muscular, etc.)
 * - Permite edición manual después de seleccionar
 * - Permite limpiar y volver a carga manual
 */
export default function ExerciseAutocomplete({
  value = '',
  libraryExerciseId = null,
  library = [],
  onChange,
  onSelectFromLibrary,
  placeholder = 'Buscar o escribir nombre del ejercicio',
  disabled = false,
  className = '',
}) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  const searchTerm = inputValue?.toLowerCase().trim() || '';
  const suggestions = searchTerm.length >= 1
    ? library.filter(ex =>
        ex.name?.toLowerCase().includes(searchTerm) ||
        (ex.muscleGroup || '').toLowerCase().includes(searchTerm)
      ).slice(0, 12)
    : library.slice(0, 10); // Si está vacío, mostrar los primeros para poder elegir

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    onChange?.(v);
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (!v) {
      onSelectFromLibrary?.(null);
    }
  };

  const handleSelect = (libEx) => {
    if (!libEx) return;
    setInputValue(libEx.name);
    onChange?.(libEx.name);
    onSelectFromLibrary?.(libEx);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClearLibrary = () => {
    onSelectFromLibrary?.(null);
    setInputValue(inputValue || '');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape') setIsOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`exercise-autocomplete ${className}`}>
      <div className="exercise-autocomplete-input-wrap">
        <input
          type="text"
          className="form-control exercise-autocomplete-input"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
        />
        {libraryExerciseId && (
          <button
            type="button"
            className="exercise-autocomplete-clear"
            onClick={handleClearLibrary}
            title="Usar carga manual"
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>
      {libraryExerciseId && (
        <span className="exercise-autocomplete-badge exercise-autocomplete-badge--library">
          Biblioteca
        </span>
      )}
      {!libraryExerciseId && inputValue?.trim() && (
        <span className="exercise-autocomplete-badge exercise-autocomplete-badge--manual">
          Manual
        </span>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="exercise-autocomplete-dropdown">
          <li className="exercise-autocomplete-dropdown-hint">
            {searchTerm ? 'Selecciona o continúa escribiendo para manual' : 'Selecciona un ejercicio de la biblioteca'}
          </li>
          {suggestions.map((ex, idx) => (
            <li
              key={ex.id}
              className={`exercise-autocomplete-item ${idx === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSelect(ex)}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              <span className="exercise-autocomplete-item-name">{ex.name}</span>
              {ex.muscleGroup && (
                <span className="exercise-autocomplete-item-meta">{ex.muscleGroup}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
