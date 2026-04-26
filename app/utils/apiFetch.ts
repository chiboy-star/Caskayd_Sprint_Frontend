export const apiFetch = async (url: string, options: RequestInit = {}) => {
    // execute the standard fetch request
    const response = await fetch(url, options);

    // catch expired or invalid tokens
    if (response.status === 401) {
        
        // wipe the dead token
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");

            // route the user to the correct login page based on their current path
            const currentPath = window.location.pathname;
            
            if (currentPath.includes("/business")) {
                window.location.href = "/business/login";
            } else if (currentPath.includes("/creator")) {
                window.location.href = "/creator/login";
            } else {
                window.location.href = "/"; // fallback
            }
        }
    }

    // return the response so your components can process it normally
    return response;
};