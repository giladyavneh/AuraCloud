import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DownloadSimpleIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  parseWatchlistJson,
  watchlistToJson,
} from '@/pages/resourceWatchlist/helpers/resourceWatchlist.helpers';
import {
  EditorButtonGroup,
  EditorPanelHeader,
  EditorWrapper,
  JsonErrorBadge,
  JsonPanelCard,
} from '@/pages/resourceWatchlist/components/resourceWatchlist.styled';
import type { JsonEditorPanelProps } from '@/pages/resourceWatchlist/types/resourceWatchlist.types';

const JsonEditorPanel: React.FC<JsonEditorPanelProps> = ({
  draftResources,
  onDraftChange,
}) => {
  const { t } = useTranslation();
  const [hasJsonError, setHasJsonError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const jsonValue = watchlistToJson(draftResources);

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;

    const parsed = parseWatchlistJson(value);
    if (parsed !== null) {
      setHasJsonError(false);
      onDraftChange(parsed);
    } else {
      setHasJsonError(true);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonValue], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'watchlist.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;

      const parsed = parseWatchlistJson(text);
      if (parsed !== null) {
        setHasJsonError(false);
        onDraftChange(parsed);
      } else {
        setHasJsonError(true);
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-uploaded
    event.target.value = '';
  };

  return (
    <JsonPanelCard>
      <EditorPanelHeader>
        <Typography variant="subtitle1" color="textPrimary">
          {t('resourceWatchlist.jsonEditor')}
        </Typography>

        <EditorButtonGroup>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadSimpleIcon size={16} />}
            onClick={handleDownload}
          >
            {t('resourceWatchlist.download')}
          </Button>

          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadSimpleIcon size={16} />}
            onClick={handleUploadClick}
          >
            {t('resourceWatchlist.upload')}
          </Button>
        </EditorButtonGroup>
      </EditorPanelHeader>

      {hasJsonError && (
        <JsonErrorBadge>{t('resourceWatchlist.jsonParseError')}</JsonErrorBadge>
      )}

      <EditorWrapper>
        <Editor
          height="100%"
          language="json"
          theme="vs-dark"
          value={jsonValue}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </EditorWrapper>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

    </JsonPanelCard>
  );
};

export default JsonEditorPanel;
