# KBG-TEST-FA
This is a simple web app for a test.

## Prerequisites

- Node.js
- Python 3.x
- OpenCV (Install with `pip install opencv-python`)

## Setup

1. Clone the repository
2. `cd frontend` and `npm install` to install dependencies
3. `npm run dev` to start the development server
4. Frontend will be running in the designated port (will appear in console)
4. `cd backend` and `npm install` to install dependencies
5. `npm run dev` to start the development server
6. Backend will be running in `http://localhost:3005` (will also appear in console)
7. Open the frontend in your browser.
8. Upload the petri pictures.
9. Check the results.

**Extra**

P.S.: If it wasn't clear enough, the OpenCV implementation was developed with the help of AI, and not flawless. Currently a hit or miss. 

There's also a toggle to switch between the AI and OpenCV implementations. The AI implementation is more reliable, but slower. The OpenCV implementation is slower but done in real time. Keep the switch off to use the CSV reference instead (faster, reliable). 

Any images that are not in the CSV reference will be ignored and an error will be shown in the frontend.

### Troubleshooting

- If you have any issues, please check the console for errors. If you see an error related to CORS, please make sure that the backend is running.

- If you see any errors related to python or OpenCV, please make sure that you have python and openCV installed. You can install OpenCV with the following command:
```bash
pip install opencv-python
```

- I'm not using ts-node for the backend so instead I use `tsx` to run the backend. It should be included in the package.json, if it's not, please install it with the following command:
```bash
npm install tsx --save-dev
```