import { LoadableDirectory } from "./loadable-directory";

/**
 * ObjectDirectory is an implementation of LoadableDirectory that loads JavaScript files with the require() function.
 * By default, only .js files will be loaded. However, .json files may be loaded as well. Simply add ".js" to fileExtensions when instantiating.
 * Simply specify a type, T. Loaded files will be cast to this type.
 */
export class ObjectDirectory<T> extends LoadableDirectory<T>
{
	/**
	 * @param directory - The directory containing objects. (If relative, relative to object-directory.ts).
	 * @param fileExtensions - Only files with these extensions will be loaded. Must include '.'.
	 */
	public constructor(directory: string, fileExtensions: Set<string> = new Set([".js"]))
	{
		super(directory, fileExtensions);
	}

	public async loadEntry(file: string): Promise<T>
	{
		await this.refreshListing();

		const path = this.resolve(file);
		const e = this.fileLocationError(path);
		if (e)
		{
			this.loadErrorMap.set(path, e)
			throw e;
		}

		let obj: T;
		try
		{
			obj = require(path);
		}

		catch (e)
		{
			this.loadErrorMap.set(path, e);
			throw e;
		}

		this.loadedEntryMap.set(path, obj);
		return obj;
	}
}
