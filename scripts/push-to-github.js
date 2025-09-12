import { Octokit } from '@octokit/rest';

let connectionSettings;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function pushToGitHub() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user info
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    const repoName = 'bankdash-financial-dashboard';
    
    // Check if repository exists
    let repo;
    try {
      const { data: existingRepo } = await octokit.rest.repos.get({
        owner: user.login,
        repo: repoName,
      });
      repo = existingRepo;
      console.log(`Found existing repository: ${repo.html_url}`);
    } catch (error) {
      if (error.status === 404) {
        // Create new repository
        const { data: newRepo } = await octokit.rest.repos.createForAuthenticatedUser({
          name: repoName,
          description: 'BankDash - Personal Financial Dashboard with Bank Account Integration',
          private: false,
          auto_init: false,
        });
        repo = newRepo;
        console.log(`Created new repository: ${repo.html_url}`);
      } else {
        throw error;
      }
    }
    
    console.log(`\nTo push your code to the repository, run these commands:`);
    console.log(`\ngit remote add origin ${repo.clone_url}`);
    console.log(`git branch -M main`);
    console.log(`git add .`);
    console.log(`git commit -m "Initial commit: BankDash Financial Dashboard"`);
    console.log(`git push -u origin main`);
    console.log(`\nYour repository URL: ${repo.html_url}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

pushToGitHub();