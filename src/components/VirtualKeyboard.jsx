import { useState, useEffect } from 'react';
import './VirtualKeyboard.css';
import { Keyboard } from 'lucide-react';

// Cấu trúc một bàn phím ANSI chuẩn (rút gọn/top-down)
const KEYBOARD_ROWS = [
  [
    { code: 'Escape', label: 'Esc' },
    { code: 'F1', label: 'F1' }, { code: 'F2', label: 'F2' }, { code: 'F3', label: 'F3' }, { code: 'F4', label: 'F4' },
    { code: 'F5', label: 'F5' }, { code: 'F6', label: 'F6' }, { code: 'F7', label: 'F7' }, { code: 'F8', label: 'F8' },
    { code: 'F9', label: 'F9' }, { code: 'F10', label: 'F10' }, { code: 'F11', label: 'F11' }, { code: 'F12', label: 'F12' }
  ],
  [
    { code: 'Backquote', label: '`' },
    { code: 'Digit1', label: '1' }, { code: 'Digit2', label: '2' }, { code: 'Digit3', label: '3' },
    { code: 'Digit4', label: '4' }, { code: 'Digit5', label: '5' }, { code: 'Digit6', label: '6' },
    { code: 'Digit7', label: '7' }, { code: 'Digit8', label: '8' }, { code: 'Digit9', label: '9' },
    { code: 'Digit0', label: '0' }, { code: 'Minus', label: '-' }, { code: 'Equal', label: '=' },
    { code: 'Backspace', label: 'Backspace', width: 2 }
  ],
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    { code: 'KeyQ', label: 'Q' }, { code: 'KeyW', label: 'W' }, { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' }, { code: 'KeyT', label: 'T' }, { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' }, { code: 'KeyI', label: 'I' }, { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' }, { code: 'BracketLeft', label: '[' }, { code: 'BracketRight', label: ']' },
    { code: 'Backslash', label: '\\', width: 1.5 }
  ],
  [
    { code: 'CapsLock', label: 'Caps Lock', width: 1.8 },
    { code: 'KeyA', label: 'A' }, { code: 'KeyS', label: 'S' }, { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' }, { code: 'KeyG', label: 'G' }, { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' }, { code: 'KeyK', label: 'K' }, { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';' }, { code: 'Quote', label: "'" },
    { code: 'Enter', label: 'Enter', width: 2.2 }
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.5 },
    { code: 'KeyZ', label: 'Z' }, { code: 'KeyX', label: 'X' }, { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' }, { code: 'KeyB', label: 'B' }, { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' }, { code: 'Comma', label: ',' }, { code: 'Period', label: '.' },
    { code: 'Slash', label: '/' },
    { code: 'ShiftRight', label: 'Shift', width: 2.5 }
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.5 },
    { code: 'MetaLeft', label: 'Win', width: 1.2 },
    { code: 'AltLeft', label: 'Alt', width: 1.2 },
    { code: 'Space', label: 'Space', width: 6 },
    { code: 'AltRight', label: 'Alt', width: 1.2 },
    { code: 'MetaRight', label: 'Win', width: 1.2 },
    { code: 'ContextMenu', label: 'Menu', width: 1.2 },
    { code: 'ControlRight', label: 'Ctrl', width: 1.5 }
  ]
];

export default function VirtualKeyboard({ onComboDetected }) {
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [pressedCombo, setPressedCombo] = useState([]);

  useEffect(() => {
    let comboTimeout;

    const handleKeyDown = (e) => {
      e.preventDefault(); // Tránh các behavior mặc định như F5, Ctrl+S... nếu muốn (tùy chọn)
      
      const code = e.code;
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(code);
        return next;
      });

      // Track the display combo text like "Ctrl + C"
      setPressedCombo((prev) => {
        const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        if (!prev.includes(keyName)) {
          return [...prev, keyName];
        }
        return prev;
      });

      // Clear any pending submission
      clearTimeout(comboTimeout);
    };

    const handleKeyUp = (e) => {
      e.preventDefault();
      
      const code = e.code;
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });

      // Trình kích hoạt độ trễ: Chờ người dùng nhả phím hoặc không bấm gì thêm 500ms
      // Thì kích hoạt combo nếu có > 0 phím
      comboTimeout = setTimeout(() => {
        setPressedCombo((currentCombo) => {
          if (currentCombo.length > 0) {
            const comboString = currentCombo.join(' + ');
            onComboDetected(comboString);
            return []; // reset combo
          }
          return currentCombo;
        });
      }, 800);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearTimeout(comboTimeout);
    };
  }, [onComboDetected]);

  return (
    <div className="virtual-keyboard-wrapper glass-card">
      <div className="vk-header">
        <Keyboard size={18} color="#6366f1" />
        <span style={{fontWeight: 600}}>Cảm Biến Bàn Phím Tích Hợp</span>
        <span style={{fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto'}}>Thử nhấn một tổ hợp phím bất kỳ (Vd: Ctrl + C)</span>
      </div>
      <div className="vk-board">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={`row-${rIdx}`} className="vk-row">
            {row.map((key) => {
              const isActive = activeKeys.has(key.code);
              return (
                <div
                  key={key.code}
                  className={`vk-key ${isActive ? 'active' : ''}`}
                  style={{ flexGrow: key.width || 1 }}
                >
                  {key.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
