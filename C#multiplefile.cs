using System.Net.Http;
using System.Net;
using System.Threading.Tasks;
using System.IO;

public async Task<HttpResponseMessage> GetFilesResponse()
{
    var response = new HttpResponseMessage(HttpStatusCode.OK);

    var files = new List<string>
    {
        "path_to_file1.txt",
        "path_to_file2.txt",
        // Add more file paths as needed
    };

    var multipartContent = new MultipartContent();

    foreach (var filePath in files)
    {
        var fileContent = new ByteArrayContent(await File.ReadAllBytesAsync(filePath));
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
        fileContent.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment")
        {
            FileName = Path.GetFileName(filePath)
        };

        multipartContent.Add(fileContent);
    }

    response.Content = multipartContent;

    return response;
}
