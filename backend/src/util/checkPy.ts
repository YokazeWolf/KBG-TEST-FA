export const checkPythonVersion = async (): Promise<string | null> => {
    try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execPromise = promisify(exec);

        // Try possible python commands
        const commands = ['py --version', 'python --version', 'python3 --version'];
        for (const cmd of commands) {
            try {
                const { stdout, stderr } = await execPromise(cmd);

                // Some Python versions print version info to stderr
                const output = stdout || stderr;
                const versionMatch = output.match(/Python (\d+\.\d+\.\d+)/);
                if (versionMatch) {
                    const version = versionMatch[1];
                    console.log(`Python version (${cmd.split(' ')[0]}):`, version);
                    return cmd.split(' ')[0];
                }
            } catch (err) {
                // If there was an error, it means the command failed, so we try the next valid one
            }
        }
        // If none of the commands worked, we return null and 
        // let the user know that Python is not installed
        console.error('Could not determine Python version');
        return null;
    } catch (error) {
        console.error('Error executing command:', error);
        return null;
    }
}