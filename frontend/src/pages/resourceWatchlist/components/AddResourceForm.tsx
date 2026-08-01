import { useAllResources, useResourceActions } from "@/hooks/resources.hooks";
import { FormRow } from "@/pages/resourceWatchlist/components/resourceWatchlist.styled";
import type { AddResourceFormProps } from "@/pages/resourceWatchlist/types/resourceWatchlist.types";
import type {
  AwsResource,
  ResourceAction,
} from "@/services/types/resources.types";
import {
  WATCHLIST_ACTIONS_SELECT_WIDTH,
  WATCHLIST_ACTIONS_VISIBLE_TAGS,
  WATCHLIST_RESOURCE_SELECT_WIDTH,
} from "@/constants";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const AddResourceForm: React.FC<AddResourceFormProps> = ({ onAdd }) => {
  const { t } = useTranslation();
  const [selectedResource, setSelectedResource] = useState<AwsResource | null>(
    null,
  );
  const [selectedActions, setSelectedActions] = useState<ResourceAction[]>([]);

  const { data: resources = [], isLoading: resourcesLoading } =
    useAllResources();
  const { data: actions = [], isLoading: actionsLoading } = useResourceActions(
    selectedResource?.arn ?? null,
  );

  const handleResourceChange = (
    _: React.SyntheticEvent,
    value: AwsResource | null,
  ) => {
    setSelectedResource(value);
    setSelectedActions([]);
  };

  const handleActionsChange = (
    _: React.SyntheticEvent,
    value: ResourceAction[],
  ) => {
    setSelectedActions(value);
  };

  const handleAdd = () => {
    if (!selectedResource) return;

    onAdd({
      arn: selectedResource.arn,
      actions: selectedActions.map((action) => action.actionName),
      _id: "",
    });
    setSelectedResource(null);
    setSelectedActions([]);
  };

  return (
    <FormRow>
      <Autocomplete<AwsResource>
        options={resources}
        value={selectedResource}
        onChange={handleResourceChange}
        loading={resourcesLoading}
        getOptionLabel={(option) => option.name || option.arn}
        isOptionEqualToValue={(option, value) => option.arn === value.arn}
        sx={{ minWidth: WATCHLIST_RESOURCE_SELECT_WIDTH }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("resourceWatchlist.selectResource")}
            size="small"
          />
        )}
      />

      <Autocomplete
        multiple
        options={actions}
        value={selectedActions}
        onChange={handleActionsChange}
        loading={actionsLoading}
        disabled={!selectedResource}
        getOptionLabel={(option) => option.actionName}
        isOptionEqualToValue={(option, value) => option._id === value._id}
        limitTags={WATCHLIST_ACTIONS_VISIBLE_TAGS}
        sx={{ width: WATCHLIST_ACTIONS_SELECT_WIDTH }}
        renderValue={(values, getItemProps) =>
          values.map((option, index) => {
            const { key, ...itemProps } = getItemProps({ index });
            return (
              <Chip
                key={key}
                label={option.actionName}
                size="small"
                {...itemProps}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("resourceWatchlist.selectActions")}
            size="small"
          />
        )}
      />

      <Button
        variant="outlined"
        onClick={handleAdd}
        disabled={!selectedResource}
        size="medium"
        // Pinned to the top of the row: the actions field gets taller once
        // chips appear, and a centred button would slide down with it.
        sx={{ alignSelf: "flex-start", marginBlockStart: 0.5 }}
      >
        {t("resourceWatchlist.add")}
      </Button>
    </FormRow>
  );
};

export default AddResourceForm;
