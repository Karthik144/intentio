export interface Data {
    id: number;
    siteUrl: string;
    message: string;
    time: number;
    unlocks: number;
    totalVisits: number;
}

export interface HeadCell {
    disablePadding: boolean;
    id: keyof Data;
    label: string;
    numeric: boolean;
}

export type Order = "asc" | "desc";

export const headCells: readonly HeadCell[] = [
    {
        id: "siteUrl",
        numeric: false,
        disablePadding: true,
        label: "Site URL",
    },
    {
        id: "message",
        numeric: false,
        disablePadding: true,
        label: "Message",
    },
    {
        id: "time", 
        numeric: true, 
        disablePadding: false, 
        label: "Time Limit"
    }, 
    {
        id: "unlocks",
        numeric: true,
        disablePadding: false,
        label: "Unlocks",
    },
    {
        id: "totalVisits",
        numeric: true,
        disablePadding: false,
        label: "Total Visits",
    },
];

export interface EnhancedTableProps {
    numSelected: number;
    onRequestSort: (
        event: React.MouseEvent<unknown>,
        property: keyof Data
    ) => void;
    onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
    order: Order;
    orderBy: string;
    rowCount: number;
}

export interface EnhancedTableToolbarProps {
    handleOpenModal: () => void;
    handleDelete: () => void; 
    numSelected: number;
}