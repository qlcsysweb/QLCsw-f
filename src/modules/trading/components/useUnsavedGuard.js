import { useState } from 'react';

/*
 * Protege el cierre de un editor con cambios sin guardar.
 * - isDirty: función o booleano que indica si hay cambios sin guardar.
 * - onClose: cierre real (descarta cambios).
 * Devuelve { requestClose, promptOpen, confirmDiscard, cancelDiscard }.
 */
export default function useUnsavedGuard(isDirty, onClose) {
  const [promptOpen, setPromptOpen] = useState(false);

  const dirty = typeof isDirty === 'function' ? isDirty() : isDirty;

  const requestClose = () => {
    if (dirty) {
      setPromptOpen(true);
    } else {
      onClose();
    }
  };

  const confirmDiscard = () => {
    setPromptOpen(false);
    onClose();
  };

  const cancelDiscard = () => setPromptOpen(false);

  return { requestClose, promptOpen, confirmDiscard, cancelDiscard };
}
