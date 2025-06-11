# README

##### Production Docker Run Command
```
docker run -d -it -p 5000:5000 -v /root/.config:/root/.config -v /root/assets:/root/assets --name dash-explorers-prod gcr.io/mf-crucible/dash-explorers-main
```



###### note: 
For CI / CD testing - open a pull request from your test branch to this branch.  Merging the pull request from your branch to this "test" branch will result in the following events: 
1. A docker image will be built with the name gcr.io/mf-crucible/dash-explorers-test
2. The docker image will be pulled to the instance-1 GCE VM and run as a docker container with the arguments specified below

This process will not interfere with the production dash explorers in any way!


##### To contribute changes you can follow these general guidelines for making updates, testing, and merging to the production code base
1. If you don't already have a copy of the repository locally, clone a copy.  If you already have a local copy then navigate to the main branch ``` git checkout main ``` and pull all updates from the remote ```git pull```
2. Checkout a new branch for the updates that you want to make. The branch name should be all lowercase and not use underscores (this is important for the docker image build process).  A decent naming convention for development branches would be short-description-your-initials ```git checkout -b <new-branch-name-of-your-choice>```
3. Add any changes that you would like and test the app locally by running `python dash_app.py app local`. If updates were only made to the Docker or cloud build files, this step can be skipped and those updates will be tested in subsequent steps. Passing the "local" arg will  pass a command line argument to app/__init__.py script to specify that this should be run using the test environment specified in the file "conf/local_config.yaml".  You can update these variables as desired for your testing use case.  Once the app is running as expected locally you can test the updates within the docker environment using the instructions below. 
4. Add, commit, and push your changes to the remote to trigger a cloud build
5. SSH connect to the instance-1 GCE VM and change to the root account
6. Pull the newly built image to the VM ``` docker image pull gcr.io/mf-crucible/dash-explorers-<your-branch-name> ```
7. Run the docker container with the following command:
    ``` docker run -d -it -p 7777:7777 -v /root/.config:/root/.config -v /root/assets:/root/assets --name dash-explorers-test gcr.io/mf-crucible/dash-explorers-test python dash_app.py app test ```
   
   - Running the container with the positional argument "test" after the image name will pass a command line argument to the app/__init__.py script to specify that this should be run using the test environment specified in the file "conf/test_config.yaml".
   - You may update any of the values present in the test_config.yaml file on your branch if you need to adjust the environment.
   - The default configuration for the test environment will deploy to port 7777 instead of 5000, will have debugging turned on, and will be served by flask with ssl_context set to adhoc. To access the test app from the internet you can navigate to https://34.28.44.212:7777/dash where 34.28.44.212 is the IP address for the VM. 
   
8. Once successfully working as intended, submit a pull request from your branch to main through the GitHub website! 
