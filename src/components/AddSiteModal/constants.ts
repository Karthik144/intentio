export const style = {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    borderRadius: 4,
    boxShadow: 24,
    p: 4,
};

export interface Data {
    id: number;
    siteUrl: string;
    message: string;
    time: number; 
    unlocks: number;
    totalVisits: number;
}

export interface SiteMetaData {
    message: string;
    time: number;
    blocked: boolean;
    unlocks: number;
    totalVisits: number;
    unlockMsgs?: string[];
    pattern?: string; 
}

export interface StorageData {
    sites: { [key: string]: SiteMetaData };
}

export interface AddSiteModalProps {
    open: boolean;
    rowDataLength: number; 
    handleSetRowData: (newData: Data) => void;
    onClose: () => void;
}