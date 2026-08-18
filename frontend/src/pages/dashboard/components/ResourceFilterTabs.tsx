import { DASHBOARD_IDS, FILTER_TABS } from "@/pages/dashboard/constants";
import {
  FilterTab,
  FilterTabCount,
  FilterTabsRow,
} from "@/pages/dashboard/components/dashboard.styled";
import type { FilterTabValue } from "@/pages/dashboard/types/dashboard.types";
import React from "react";
import { useTranslation } from "react-i18next";

interface ResourceFilterTabsProps {
  activeFilter: FilterTabValue;
  tabCounts: Record<FilterTabValue, number>;
  showCounts: boolean;
  onFilterChange: (filter: FilterTabValue) => void;
}

const ResourceFilterTabs: React.FC<ResourceFilterTabsProps> = ({
  activeFilter,
  tabCounts,
  showCounts,
  onFilterChange,
}) => {
  const { t } = useTranslation();

  return (
    <FilterTabsRow id={DASHBOARD_IDS.filterTabs}>
      {FILTER_TABS.map((tab) => (
        <FilterTab
          key={tab}
          id={`${DASHBOARD_IDS.filterTabs}-${tab}`}
          isActive={activeFilter === tab}
          onClick={() => onFilterChange(tab)}
          role="button"
          tabIndex={0}
          onKeyDown={(event: React.KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onFilterChange(tab);
            }
          }}
        >
          {t(`dashboard.filterTabs.${tab}`)}
          {showCounts && (
            <FilterTabCount isActive={activeFilter === tab}>{tabCounts[tab]}</FilterTabCount>
          )}

        </FilterTab>
      ))}

    </FilterTabsRow>
  );
};

export default ResourceFilterTabs;
