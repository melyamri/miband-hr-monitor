# Mi Band Heart Rate Monitor

A simple electron real time heart monitor that uses Mi Band 2.

## Mi Band set up on Linux

```
sudo apt-get install bluetooth bluez bluez-tools rfkill 
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```

## Run

`npm start`


## License

[CC0 1.0 (Public Domain)](LICENSE.md)


## Acknowledgments

- Front based on Dave Maxwell's Pen at https://codepen.io/davemaxwell/pen/zVGBBL

