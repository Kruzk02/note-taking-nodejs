export default function sendResponse(res, statusCode, contentType, data) {
    res.writeHead(statusCode, { "Content-Type": contentType });

    const responseData = (contentType === "application/json") ? JSON.stringify(data) : data;

    return res.end(responseData);
}
