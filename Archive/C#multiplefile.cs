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



using Microsoft.AspNetCore.Mvc;
using System.IO;

public class FileController : ControllerBase
{
    public IActionResult GetFilesResponse()
    {
        var files = new List<string>
        {
            "path_to_file1.txt",
            "path_to_file2.txt",
            // Add more file paths as needed
        };

        var memoryStream = new MemoryStream();

        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            foreach (var filePath in files)
            {
                var entryName = Path.GetFileName(filePath);
                var entry = archive.CreateEntry(entryName);

                using (var entryStream = entry.Open())
                using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
                {
                    fileStream.CopyTo(entryStream);
                }
            }
        }

        memoryStream.Seek(0, SeekOrigin.Begin);

        return new FileStreamResult(memoryStream, "application/zip")
        {
            FileDownloadName = "files.zip"
        };
    }
}



using Microsoft.AspNetCore.Mvc;
using System.IO;

public class FileController : ControllerBase
{
    public IActionResult GetFilesResponse()
    {
        var files = new List<string>
        {
            "path_to_file1.txt",
            "path_to_file2.txt",
            // Add more file paths as needed
        };

        var fileStreams = new List<Stream>();

        foreach (var filePath in files)
        {
            var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            fileStreams.Add(fileStream);
        }

        var result = new FileStreamResult(fileStreams[0], "application/octet-stream")
        {
            FileDownloadName = "file1.txt"
        };

        return result;
    }
}





using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Web.Http;

public class FileController : ApiController
{
    public HttpResponseMessage Get()
    {
        // Replace with your actual file path
        string filePath = "C:\\path\\to\\your\\file.msg";

        if (File.Exists(filePath))
        {
            HttpResponseMessage response = new HttpResponseMessage(HttpStatusCode.OK);

            byte[] fileBytes = File.ReadAllBytes(filePath);
            MemoryStream memoryStream = new MemoryStream(fileBytes);

            response.Content = new StreamContent(memoryStream);
            response.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment")
            {
                FileName = "file.msg"
            };

            response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
            response.Headers.Add("Custom-Message", "File downloaded successfully.");

            return response;
        }
        else
        {
            return Request.CreateErrorResponse(HttpStatusCode.NotFound, "File not found.");
        }
    }
}






