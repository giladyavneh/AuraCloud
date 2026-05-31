import { useAllResources, useResourceActions } from "@/hooks/resources.hooks";
import { FormRow } from "@/pages/resourceWatchlist/components/resourceWatchlist.styled";
import type { AddResourceFormProps } from "@/pages/resourceWatchlist/types/resourceWatchlist.types";
import type {
  AwsResource,
  ResourceAction,
} from "@/services/types/resources.types";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const AUTOCOMPLETE_MIN_WIDTH = 280;

const AddResourceForm: React.FC<AddResourceFormProps> = ({
  onAdd,
  existingArns,
}) => {
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

  const availableResources = resources.filter(
    (r) => !existingArns.includes(r.arn),
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
      actions: selectedActions.map((a) => a.actionName),
      _id: "",
    });
    setSelectedResource(null);
    setSelectedActions([]);
  };

  return (
    <FormRow>
      <Autocomplete<AwsResource>
        options={availableResources}
        value={selectedResource}
        onChange={handleResourceChange}
        loading={resourcesLoading}
        getOptionLabel={(option) => option.name || option.arn}
        isOptionEqualToValue={(option, value) => option.arn === value.arn}
        sx={{ minWidth: AUTOCOMPLETE_MIN_WIDTH }}
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
        sx={{ minWidth: AUTOCOMPLETE_MIN_WIDTH }}
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
        sx={{ alignSelf: "center" }}
      >
        {t("resourceWatchlist.add")}
      </Button>
    </FormRow>
  );
};

export default AddResourceForm;
