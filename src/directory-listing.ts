import * as FS from "fs";
import * as Path from "path";

/**
 * The DirectoryListing class simply retrieves a listing of all files with the provided extensions.
 * If you wish to load file contents, consider using a class that extends LoadableDirectory or creating one yourself..
 */
export class DirectoryListing
{
	private readonly directory: string;

	/**
	 * The directory that the files are stored in.
	 */
	public get Directory(): string
	{ return this.directory; }

	private filePaths: Set<string>;

	/**
	 * Lists paths of all files in this.Directory. Each path is absolute.
	 */
	public get FilePaths(): Set<string>
	{ return new Set(this.filePaths) }

	private supportedExtensions: Set<string>;

	/**
	 * A Set of supported file extensions. Only files with these extensions will be loaded.
	 */
	public get SupportedExtensions(): Set<string>
	{ return new Set(this.supportedExtensions); }

	protected loadErrorMap: Map<string, Error>

	/**
	 * The first error that occurred on the previous attempt to load objects. (undefined if no errors)
	 */
	public get LoadErrorMap(): Map<string, Error>
	{ return new Map(this.loadErrorMap); }

	/**
	 * @param directory - The directory containing files. Must be an absolute path.
	 * @param fileExtensions - Only files with these extensions will be loaded. Must include '.'.
	 * @throws RangeError if directory is not an absolute path.
	 */
	public constructor(directory: string, fileExtensions: Set<string>)
	{
		if (!Path.isAbsolute(directory))
		{
			throw new RangeError(`'${ directory }' is not an absolute path!`);
		}

		this.directory = Path.resolve(directory); // Will remove trailing seperators if any.
		this.filePaths = new Set();
		this.supportedExtensions = new Set(fileExtensions);
		this.loadErrorMap = new Map();
	}

	/**
	 * Refreshes directory listing. (i.e. updates this.FilePaths)
	 */
	public async refreshListing(): Promise<void>
	{
		this.loadErrorMap.clear();

		let entries: Array<FS.Dirent>;

		try
		{
			entries = await FS.promises.readdir(this.Directory, { withFileTypes: true });
		}

		catch (e)
		{
			this.loadErrorMap.set(this.Directory, e);
			throw e;
		}

		const files = entries.filter(entry => entry.isFile());

		const parsedFiles = files.map(file => Path.parse(file.name));

		const supportedFiles = parsedFiles.filter(file => this.SupportedExtensions.has(file.ext))

		const paths = supportedFiles.map(file => Path.join(this.Directory, file.base));

		this.filePaths = new Set(paths);
	}

	/**
	 * Behaves identically to Path.resolve except relative paths are resolved relative to this.Directory.
	 * @param file - The file path to resolve
	 */
	public resolve(file: string): string
	{
		let path = Path.isAbsolute(file) ? file : Path.join(this.Directory, file);
		return Path.resolve(path);
	}

	/**
	 * Checks to see if a file path is in this.Directory. If it is, also check if it exists.
	 * @param file - a file path to check. If relative, it will be relative to this.Directory.
	 * @returns {Error} if there is a problem with the provided file path. Otherwise returns {null}.
	 */
	public fileLocationError(file: string): Error | null
	{
		const path = this.resolve(file);
		const parsed = Path.parse(path);

		if (parsed.dir !== this.Directory)
		{
			return new RangeError(`File '${ path }' is not in directory '${ this.Directory }'.`);
		}

		if (!this.FilePaths.has(path))
		{
			return new RangeError(`File '${ path }' does not exist, is not a file, or could not be accessed.`);
		}

		return null;
	}
}
