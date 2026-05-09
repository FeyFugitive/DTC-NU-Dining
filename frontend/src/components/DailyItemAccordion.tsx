import React, { useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import clsx from "clsx";
import { DailyItem } from "../types/ItemTypes";

interface Props {
  items: DailyItem[];
  availableFavorites: DailyItem[];
  handleItemClick: (item: DailyItem) => void;
  /** When set, the label opens the food detail page; the star still toggles favorites. */
  onOpenItem?: (item: DailyItem) => void;
  expandFolders: boolean;
}

function MenuItemRow({
  item,
  favoritesAccordionChrome,
  isFavorite,
  rowClass,
  onOpenItem,
  handleItemClick,
}: {
  item: DailyItem;
  /** Rows listed under “My Favorites” keep the chart-accent styling. */
  favoritesAccordionChrome: boolean;
  isFavorite: boolean;
  rowClass: string;
  onOpenItem?: (item: DailyItem) => void;
  handleItemClick: (item: DailyItem) => void;
}) {
  const unfavLine =
    "bg-card text-card-foreground border-border hover:bg-item-hover hover:border-muted-foreground";
  const favLineStation =
    "bg-item-selected text-item-selected-foreground border-primary shadow-sm";
  const favLineAccordion =
    "bg-item-selected text-item-selected-foreground border-chart-5 shadow-sm";
  const chromeLine = favoritesAccordionChrome
    ? favLineAccordion
    : isFavorite
      ? favLineStation
      : unfavLine;

  const title =
    (item.Name && item.Name.trim()) ||
    (item.Description && item.Description.trim()) ||
    "Menu item";

  if (onOpenItem) {
    return (
      <li className="flex min-w-0 items-stretch gap-1.5">
        <button
          type="button"
          onClick={() => onOpenItem(item)}
          className={clsx(
            rowClass,
            // Do not use w-full here: it fights flex-1 inside a row and can collapse the label under accordion overflow:hidden.
            "min-w-0 flex-1 text-left",
            chromeLine,
          )}
        >
          <span className="block min-w-0 truncate">{title}</span>
        </button>
        <button
          type="button"
          aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
          onClick={(e) => {
            e.preventDefault();
            handleItemClick(item);
          }}
          className={clsx(rowClass, "shrink-0 px-3", chromeLine)}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </li>
    );
  }

  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={() => handleItemClick(item)}
        className={clsx(rowClass, "w-full text-left", chromeLine)}
      >
        {title} {isFavorite ? "★" : "☆"}
      </button>
    </li>
  );
}

const DailyItemAccordion: React.FC<Props> = ({
  items,
  availableFavorites,
  handleItemClick,
  onOpenItem,
  expandFolders,
}) => {
  // Group items by StationName
  const itemsByStation = items.reduce<Record<string, DailyItem[]>>((acc, item) => {
    if (!acc[item.StationName]) {
      acc[item.StationName] = [];
    }
    acc[item.StationName].push(item);
    return acc;
  }, {});

  const favoritesPanelId = "My Favorites";

  // State to keep track of expanded stations within a location (empty until user opens or expandFolders is on).
  const [expandedState, setExpandedState] = React.useState<string[]>(() => {
    if (!expandFolders) return [];
    const keys = Object.keys(itemsByStation);
    return availableFavorites.length > 0 ? [favoritesPanelId, ...keys] : keys;
  });

  // Function to handle the accordion toggle
  const handleAccordionChange = (panelId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    if (expandedState.includes(panelId) && !isExpanded) {
      setExpandedState((prev) => prev.filter((id) => id !== panelId));
    } else {
      setExpandedState((prev) => [...prev, panelId]);
    }
  };

  // Expand every station when expandFolders is turned on (e.g. search / bulk expand UX).
  useEffect(() => {
    if (expandFolders) {
      const keys = Object.keys(itemsByStation);
      setExpandedState(
        availableFavorites.length > 0 ? [favoritesPanelId, ...keys] : keys
      );
    }
  }, [expandFolders]);

  const compactItemButtonClass =
    "rounded-md border px-3 py-2 text-[13px] font-medium leading-tight transition-colors duration-150 focus:outline-none";

  return (
    <div>
      {/* My Favorites Accordion */}
      {availableFavorites.length > 0 && (
        <Accordion
          expanded={expandedState.includes(favoritesPanelId)}
          onChange={handleAccordionChange(favoritesPanelId)}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="my-favorites-content"
            id="my-favorites-header"
          >
            {favoritesPanelId}
          </AccordionSummary>
          <AccordionDetails className="min-w-0">
            <ul className="min-w-0 space-y-1.5">
              {availableFavorites.map((item, index) => (
                <MenuItemRow
                  key={`fav-${item.Name}-${index}`}
                  item={item}
                  favoritesAccordionChrome
                  isFavorite
                  rowClass={compactItemButtonClass}
                  onOpenItem={onOpenItem}
                  handleItemClick={handleItemClick}
                />
              ))}
            </ul>
          </AccordionDetails>
        </Accordion>
      )}

      {Object.entries(itemsByStation).map(([stationName, stationItems]) => (
        <Accordion
          key={stationName}
          expanded={expandedState.includes(stationName)}
          onChange={handleAccordionChange(stationName)}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`${stationName}-content`}
            id={`${stationName}-header`}
          >
            {stationName}
          </AccordionSummary>
          <AccordionDetails className="min-w-0">
            <ul className="min-w-0 space-y-1.5">
              {stationItems.map((item, index) => {
                const isFavorite = availableFavorites.some((fav) => fav.Name === item.Name);
                return (
                  <MenuItemRow
                    key={`${item.Name}-${index}`}
                    item={item}
                    favoritesAccordionChrome={false}
                    isFavorite={isFavorite}
                    rowClass={compactItemButtonClass}
                    onOpenItem={onOpenItem}
                    handleItemClick={handleItemClick}
                  />
                );
              })}
            </ul>
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );

};

export default DailyItemAccordion;
