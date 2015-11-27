
//VARS
//**********
var fpsOut = document.getElementById('boldStuff');
var fpsTracker = document.getElementById('fpsTracker');
var transOutput = document.getElementById('myTrans'),
  rotOutput = document.getElementById('myRot'),
  statOutput = document.getElementById('myStat'),
  canvas = document.getElementById('canvas');

var mWidth = 0,
    mHeight = 0;
  
var fps = 0,
    now = 0, 
    lastUpdate = 0
    fpsFilter = 50;
  
var canCon = canvas.getContext('2d'); 
var startTracking = false;
var draw = true;

var splineResolution = 5;

var CHIN_POINTS = "#8080FF",
  INNER_LIP_POINTS  = "#EC0000",
  OUTER_LIP_POINTS  = "#EC0000",
  NOSE_COLOR      = "#646464",
  IRIS_COLOR      = "#FFFF64",
  EYES_COLOR      = "#FF8F20",
  EYES_COLOR_CLOSED =   "#FF0000",
  CHEEKS_COLOR    =   "#646464",
  EYEBROWS_COLOR    =   "#E3FE49",
  HAIR_COLOR      =   "#646464",
  GAZE_COLOR      = "#00FF00";
  
var styles = {'LINE' : 0, 'LINELOOP' : 1, 'POINT' : 2, 'SPLINE' : 3}
  
//FPS - Refreshes FPS display every 1000ms
// setInterval(function(){
//   fpsOut.innerHTML = fps.toFixed(1) + "fps";
// }, 10);

/*
* Draw spline
*/
function drawSpline2D(points, color, resolution)
{
  var oldWidth = canCon.lineWidth;
  var step = 1 / resolution;

  canCon.beginPath();
  canCon.strokeStyle = color;
  canCon.lineWidth = 0.2;
  canCon.moveTo(points[0], points[1]);

  var newPoints = [];

  for (var i = 0; i < resolution; i++)
  {
    var t = step * i;
    var B0 = Math.pow((1-t), 3)
    var B1 = 3 * t * Math.pow((1-t), 2);
    var B2 = 3 * Math.pow(t, 2) * (1-t)
    var B3 = Math.pow(t, 3);

    var px = (B0 * points[0]) + (B1 * points[2]) + (B2 * points[4]) + (B3 * points[6]);
    var py = (B0 * points[1]) + (B1 * points[3]) + (B2 * points[5]) + (B3 * points[7]);

    newPoints.push([px, py]);
  }

  newPoints.push([points[6], points[7]]);

  for (var i = 1; i < newPoints.length; i++)
  {
    canCon.lineTo(newPoints[i][0], newPoints[i][1]);
    canCon.stroke();
  }

  canCon.closePath();
  canCon.lineWidth = oldWidth;
}

/*
* Draw lines using canvas draw methods
*/
function drawPoints2D(points, pointsNum, style, featurePoints2D, color)
{
  V = [];

  canCon.beginPath();
  canCon.closePath();
  
  var n = 0;
  for (var i = 0; i < pointsNum*2; i+=2){
    if (featurePoints2D.fp[points[i]][points[i+1]-1].defined === 1){
      var x = featurePoints2D.fp[points[i]][points[i+1]-1].pos[0]*canvas.width;
      var y = (1 - featurePoints2D.fp[points[i]][points[i+1]-1].pos[1])*canvas.height;

      if (style === styles.SPLINE)
              createKnot(x,y);
            else
            {
              if (style === styles.POINT){
          canCon.beginPath();
          canCon.fillStyle = color;
          canCon.arc(x,y,2,0,2*Math.PI,true);
          canCon.closePath();
          canCon.fill();
        }
        if (style === styles.LINE){
          if (n%2 === 0){
            canCon.beginPath();
            canCon.moveTo(x,y);
          }
          else {
            canCon.lineTo(x,y);
            canCon.strokeStyle = color;
            canCon.stroke();
            canCon.closePath();
          }
        }
        if (style === styles.LINELOOP){
          if (n==0){
            canCon.beginPath();
            canCon.moveTo(x,y);
          }
          else{
            canCon.lineTo(x,y);
            canCon.strokeStyle = color;
            canCon.stroke();
            canCon.closePath();
            canCon.beginPath();
            canCon.moveTo(x,y);
          }
        }
            }
      
      n++;
    }
  }

  if (style === styles.SPLINE)
  {
    updateSplines();
      //console.log(S);

      for (var m=0; m< S.length;m++)
      {
        for (var l=0; l< S[m].length;l+=2)
        {
          drawSpline2D (S[m], color, splineResolution);
        }
      }
  }
  
    
      
  if (style == styles.LINELOOP){
    var x = featurePoints2D.fp[points[0]][points[1]-1].pos[0]*canvas.width;
    var y = (1 - featurePoints2D.fp[points[0]][points[1]-1].pos[1])*canvas.height;
    canCon.lineTo(x,y);
    canCon.strokeStyle = color;
    canCon.stroke();
    canCon.closePath();
  }
}

/*
* Draw facial features
*/
function drawFaceFeatures(featurePoints2D)
{
    //V = [];
    
    var GrSize = [0,0,14,14,6,4,4,1,10,15,10,5];
  
  var chinPoints = [
    2,  14,
    2,  12,
    2,  1,
    2,  11,
    2,  13,
    2,  10,
  ]
  var chinLinesPoints = [
    2,  1,
    2,  10,
  ]

  var chinSplinePoints = [
    2,  14,
    2,  12,
    2,  1,
    2,  11,
    2,  13,
  ]

  drawPoints2D(chinLinesPoints, 2, styles.LINE, featurePoints2D,CHIN_POINTS);
  drawPoints2D(chinSplinePoints, 5, styles.SPLINE,  featurePoints2D,CHIN_POINTS);
  drawPoints2D(chinPoints, 6, styles.POINT,  featurePoints2D,CHIN_POINTS);

  
  var innerLipPoints = [
    2,  2,
    2,  6,
    2,  4,
    2,  8,
    2,  3,
    2,  9,
    2,  5,
    2,  7,
  ]

  var upperInnerLipPoints = [
    2,  5,
    2,  7,
    2,  2,
    2,  6,
    2,  4,
  ]

  var lowerInnerLipPoints = [
    2,  5,
    2,  9,
    2,  3,
    2,  8,
    2,  4,    
  ]

  drawPoints2D(upperInnerLipPoints, 5, styles.SPLINE, featurePoints2D, INNER_LIP_POINTS);
  drawPoints2D(lowerInnerLipPoints, 5, styles.SPLINE, featurePoints2D, INNER_LIP_POINTS);
  drawPoints2D(innerLipPoints, 8, styles.POINT, featurePoints2D, INNER_LIP_POINTS);
  /*drawPoints2D(innerLipPoints, 8, styles.LINELOOP,featurePoints2D,INNER_LIP_POINTS);*/

  var outerLipPoints = [
    8,  1,
    8,  10,
    8,  5,
    8,  3,
    8,  7,
    8,  2,
    8,  8,
    8,  4,
    8,  6,
    8,  9,
  ]

  var upperOuterLipPointsLeft = [
    8,  4,
    8,  6,
    8,  9,
    8,  1,
  ]

  var upperOuterLipPointsRight = [
    8,  1,
    8,  10,
    8,  5,
    8,  3,
  ]

  var lowerOuterLipPoints = [
    8,  4,
    8,  8,
    8,  2,
    8,  7,
    8,  3,    
  ]

  drawPoints2D(upperOuterLipPointsLeft, 4, styles.SPLINE, featurePoints2D, OUTER_LIP_POINTS);
  drawPoints2D(upperOuterLipPointsRight, 4, styles.SPLINE, featurePoints2D, OUTER_LIP_POINTS);
  drawPoints2D(lowerOuterLipPoints, 5, styles.SPLINE, featurePoints2D, OUTER_LIP_POINTS);
  drawPoints2D(outerLipPoints, 10, styles.POINT,featurePoints2D,OUTER_LIP_POINTS);
  /*drawPoints2D(outerLipPoints, 10, styles.LINELOOP,featurePoints2D,OUTER_LIP_POINTS);*/

  var nosePoints = [
    9,  1,
    9,  2,
    9,  3,
    9,  4,
    9,  5,
    9,  6,
    9,  7,
    9,  8,
    9,  9,
    9,  10,
    9,  11,
    9,  12,
    9,  13,
    9,  14,
    9,  15,
  ]
  var noseLinesPoints1 = [
    9,  15,   //part one
    9,  4,
    9,  2,
    9,  3,
    9,  1,
    9,  5,
  ]
  var noseLinesPoints2 = [
    9,  6,    //part two
    9,  7,
    9,  13,
    9,  12,
    9,  14,
  ]
  var noseLinesPoints3 = [
    9,  14,   //part three
    9,  2,
    9,  13,
    9,  1,
  ]

  drawPoints2D(nosePoints, 15, styles.POINT,featurePoints2D,NOSE_COLOR);
  drawPoints2D(noseLinesPoints1, 6, styles.LINELOOP,featurePoints2D,NOSE_COLOR);
  drawPoints2D(noseLinesPoints2, 5, styles.LINELOOP,featurePoints2D,NOSE_COLOR);
  drawPoints2D(noseLinesPoints3, 4, styles.LINE,featurePoints2D,NOSE_COLOR);

  if(faceData.eyeClosure[1])
  {
    //if eye is open, draw the iris
    var irisPoints = [
      3,  5,
      3,  6,
    ]
    drawPoints2D(irisPoints, 2,styles.POINT, featurePoints2D,IRIS_COLOR);
  }

  var eyesPointsR = [
    3,  2,
    3,  4,
    3,  8,
    3,  10,
    3,  12,
    3,  14,
  ]
  var eyesPointsL = [
    3,  1,
    3,  3,
    3,  7,
    3,  9,
    3,  11,
    3,  13,
  ]
  var rightEyeOuterUpper = [
    3,  12,
    3,  14,
    3,  8,
  ]
  var rightEyeOuterLower = [
    3,  12,
    3,  10,
    3,  8,
  ]
  var rightEyeInnerUpper = [
    3,  12,
    12, 10,
    3,  2,
    12, 6,
    3,  8,
  ]
  var rightEyeInnerLower = [
    3,  12,
    12, 12,
    3,  4,
    12, 8,
    3,  8,
  ]

  var leftEyeOuterUpper = [
    3,  11,
    3,  13,
    3,  7,
  ]
  var leftEyeOuterLower = [
    3,  11,
    3,  9,
    3,  7,
  ]
  var leftEyeInnerUpper = [
    3,  11,
    12, 9,
    3,  1,
    12, 5,
    3,  7,
  ]
  var leftEyeInnerLower = [
    3,  11,
    12, 11,
    3,  3,
    12, 7,
    3,  7,
  ]

  /*var eyesLinesPoints1 = [
    3,  12,
    3,  14,
    3,  8,
    3,  10,
  ]
  var eyesLinesPoints2 = [
    3,  12,
    12, 10,
    3,  2,
    12, 6,
    3,  8,
    12, 8,
    3,  4,
    12, 12,
  ]
  var eyesLinesPoints3 = [
    3,  11,
    3,  13,
    3,  7,
    3,  9,
  ]
  var eyesLinesPoints4 = [
    3,  11,
    12, 9,
    3,  1,
    12, 5,
    3,  7,
    12, 7,
    3,  3,
    12, 11,
  ]*/

  //draw points and lines for right eye
  if(faceData.eyeClosure[1]){
    drawPoints2D(rightEyeOuterUpper, 3, styles.SPLINE, featurePoints2D, EYES_COLOR);
    drawPoints2D(rightEyeOuterLower, 3, styles.SPLINE, featurePoints2D, EYES_COLOR);
    drawPoints2D(rightEyeInnerUpper, 5, styles.SPLINE, featurePoints2D, EYES_COLOR);
    drawPoints2D(rightEyeInnerLower, 5, styles.SPLINE, featurePoints2D, EYES_COLOR);
    drawPoints2D(eyesPointsR, 6, styles.POINT,featurePoints2D,EYES_COLOR);
    //drawPoints2D(eyesLinesPoints1, 4,styles.LINELOOP, featurePoints2D,EYES_COLOR);
    //drawPoints2D(eyesLinesPoints2, 8,styles.LINELOOP, featurePoints2D,EYES_COLOR);
  }
  else if (!faceData.eyeClosure[1])
  {
    drawPoints2D(rightEyeOuterUpper, 3, styles.SPLINE, featurePoints2D, EYES_COLOR_CLOSED);
    drawPoints2D(rightEyeOuterLower, 3, styles.SPLINE, featurePoints2D, EYES_COLOR_CLOSED);
    drawPoints2D(rightEyeInnerUpper, 5, styles.SPLINE, featurePoints2D, EYES_COLOR_CLOSED);
    drawPoints2D(rightEyeInnerLower, 5, styles.SPLINE, featurePoints2D, EYES_COLOR_CLOSED);
    drawPoints2D(eyesPointsR, 6, styles.POINT,featurePoints2D,EYES_COLOR_CLOSED);
    //drawPoints2D(eyesLinesPoints1, 4,styles.LINELOOP, featurePoints2D,EYES_COLOR_CLOSED);
    //drawPoints2D(eyesLinesPoints2, 8,styles.LINELOOP, featurePoints2D,EYES_COLOR_CLOSED);
  }

  //draw points and lines for left eye
  if(faceData.eyeClosure[0]){
    drawPoints2D(leftEyeOuterUpper, 3, styles.SPLINE, featurePoints2D, EYES_COLOR);
    drawPoints2D(leftEyeOuterLower, 3, styles.SPLINE, featurePoints2D, EYES_COLOR);
    drawPoints2D(leftEyeInnerUpper, 5, styles.SPLINE, featurePoints2D, EYES_COLOR);
    drawPoints2D(leftEyeInnerLower, 5, styles.SPLINE, featurePoints2D, EYES_COLOR);
    drawPoints2D(eyesPointsL, 6, styles.POINT,featurePoints2D,EYES_COLOR);
    //drawPoints2D(eyesLinesPoints3, 4,styles.LINELOOP, featurePoints2D,EYES_COLOR);
    //drawPoints2D(eyesLinesPoints4, 8,styles.LINELOOP, featurePoints2D,EYES_COLOR);
  }
  else if (!faceData.eyeClosure[0])
  {
    drawPoints2D(leftEyeOuterUpper, 3, styles.SPLINE, featurePoints2D, EYES_COLOR_CLOSED);
    drawPoints2D(leftEyeOuterLower, 3, styles.SPLINE, featurePoints2D, EYES_COLOR_CLOSED);
    drawPoints2D(leftEyeInnerUpper, 5, styles.SPLINE, featurePoints2D, EYES_COLOR_CLOSED);
    drawPoints2D(leftEyeInnerLower, 5, styles.SPLINE, featurePoints2D, EYES_COLOR_CLOSED);
    drawPoints2D(eyesPointsL, 6, styles.POINT,featurePoints2D,EYES_COLOR_CLOSED);
    //drawPoints2D(eyesLinesPoints3, 4,styles.LINELOOP, featurePoints2D,EYES_COLOR_CLOSED);
    //drawPoints2D(eyesLinesPoints4, 8,styles.LINELOOP, featurePoints2D,EYES_COLOR_CLOSED);
  }


  var cheekPoints = [
    5,  1,
    5,  2,
    5,  3,
    5,  4,
  ]

  drawPoints2D(cheekPoints, 4, styles.POINT,featurePoints2D,CHEEKS_COLOR);

  ////draw ears
  var earPoints = [
    10, 1,
    10, 2,
    10, 3,
    10, 4,
    10, 5,
    10, 6,
    10, 7,
    10, 8,
    10, 9,
    10, 10,
  ]

  drawPoints2D(earPoints, 10, styles.POINT,featurePoints2D,CHEEKS_COLOR);

  ////draw lines connecting ears and cheeks
  var earcheekLinesPoints1 = [
    5,  2,
    5,  4,
    10, 10,
    10, 8,
  ]
  var earcheekLinesPoints2 = [
    5,  1,
    5,  3,
    10, 9,
    10, 7,
  ]

  drawPoints2D(earcheekLinesPoints1, 4, styles.LINELOOP,featurePoints2D,CHEEKS_COLOR);
  drawPoints2D(earcheekLinesPoints2, 4, styles.LINELOOP,featurePoints2D,CHEEKS_COLOR);

  ////draw eyebrows
  var eyebrowPoints = [
    4,  1,
    4,  2,
    4,  3,
    4,  4,
    4,  5,
    4,  6,
  ]
  var leftEyebrow = [
    4,  6,
    4,  4,
    4,  2,
  ]
  var rightEyebrow = [
    4,  1,
    4,  3,
    4,  5,
  ]

  /*var eyebrowLinesPoints = [
    4,  6,
    4,  4,
    4,  4,
    4,  2,
    4,  1,
    4,  3,
    4,  3,
    4,  5,
  ]*/

  drawPoints2D(leftEyebrow, 3, styles.SPLINE, featurePoints2D, EYEBROWS_COLOR);
  drawPoints2D(rightEyebrow, 3, styles.SPLINE, featurePoints2D, EYEBROWS_COLOR);
  drawPoints2D(eyebrowPoints, 6, styles.POINT,featurePoints2D,EYEBROWS_COLOR);
  /*drawPoints2D(eyebrowLinesPoints, 8, styles.LINE,featurePoints2D,EYEBROWS_COLOR);*/

  ////draw head/hair

  var hairPoints = [
    11, 1,
    11, 2,
    11, 3,
    11, 4,
    11, 5,
    11, 6,
  ]
  var hairLinesPoints = [
    11, 2,
    11, 1,
    11, 3,
  ]

  drawPoints2D(hairPoints, 6, styles.POINT, featurePoints2D, HAIR_COLOR);
  drawPoints2D(hairLinesPoints, 3, styles.SPLINE, featurePoints2D, HAIR_COLOR);
    
    /*updateSplines();
    console.log(S);

    for (var k=0;k<3;k+=1)
    {
        for (var l=0; l< S[k][0].length/2;l+=2)
        {
            canCon.beginPath();
            canCon.fillStyle = GAZE_COLOR;
            canCon.arc(S[k][0][l],S[k][0][l+1],2,0,2*Math.PI,true);
            canCon.closePath();
            canCon.fill();
        }
    }*/
}

function testConfig(){
  var mylist=document.getElementById("myList");
  var cfgPath = "../../lib/"+mylist.options[mylist.selectedIndex].text;
  m_Tracker.setConfigurationFile(cfgPath);
}

function multiplyMatrix(m1, m2) {
    var result = [];
    for(var j = 0; j < m2.length; j++) {
        result[j] = [];
        for(var k = 0; k < m1[0].length; k++) {
            var sum = 0;
            for(var i = 0; i < m1.length; i++) {
                sum += m1[i][k] * m2[j][i];
            }
            result[j].push(sum);
        }
    }
    return result;
}

function drawGaze(trackData){

  if (!faceData.eyeClosure[1])
    return;
  //set projection
  var f = 3;

  var x_offset = 1;
  var y_offset = 1;

  if (canvas.width > canvas.height)
    x_offset = canvas.width / canvas.height;
  else if (canvas.width < canvas.height)
    y_offset = canvas.height / canvas.width;
    
  var frustum_near = 0.001;
  var frustum_far = 30;
  var frustum_x = x_offset*frustum_near/f;
  var frustum_y = y_offset*frustum_near/f;
  
  var A = (frustum_x - frustum_x)/(frustum_x + frustum_x);
  var B = (frustum_y - frustum_y)/(frustum_y + frustum_y);
  var C = - ((frustum_far + frustum_near)/(frustum_far - frustum_near));
  var D = - ((2*frustum_near*frustum_far)/(frustum_far-frustum_near));
  var x1 = (2*frustum_near)/(frustum_x+frustum_x);
  var y2 = (2*frustum_near)/(frustum_y+frustum_y);
  var frustumMatrix = [[x1,0,A,0],[0,y2,B,0],[0,0,C,D],[0,0,-1,0]];
    
  
  var dest = [0,0,0.05];
  
  var sinrx = Math.sin(faceData.gazeDirectionGlobal[0]);
  var sinry = Math.sin(faceData.gazeDirectionGlobal[1]);
  var sinrz = Math.sin(faceData.gazeDirectionGlobal[2]);
  var cosrx = Math.cos(faceData.gazeDirectionGlobal[0]);
  var cosry = Math.cos(faceData.gazeDirectionGlobal[1]);
  var cosrz = Math.cos(faceData.gazeDirectionGlobal[2]);
  
  //set the rotation matrix
  var R00 = cosry*cosrz+sinrx*sinry*sinrz;
  var R01 = -cosry*sinrz+sinrx*sinry*cosrz;
  var R02 = cosrx*sinry;
  var R10 = cosrx*sinrz;
  var R11 = cosrx*cosrz;
  var R12 = -sinrx;
  var R20 = -sinry*cosrz+sinrx*cosry*sinrz;
  var R21 = sinry*sinrz+sinrx*cosry*cosrz;
  var R22 = cosrx*cosry;
  
  //apply rotation
  var dest_new = [0,0,0];
  dest_new[0] = 1*(R00*dest[0]+R01*dest[1]+R02*dest[2]);
  dest_new[1] = 1*(R10*dest[0]+R11*dest[1]+R12*dest[2]);
  dest_new[2] = 1*(R20*dest[0]+R21*dest[1]+R22*dest[2]);
  
  dest = dest_new;

  //project on the screen
  var destPom = [[dest[0],dest[1],dest[2],1]];
  var result = multiplyMatrix(destPom,frustumMatrix);
  
  dest[0] /= dest[2]*3;
  dest[1] /= dest[2]*3;
  dest[2] /= dest[2]*3;
  
  dest[0] = result[0][0];
  dest[1] = result[0][1];
  dest[2] = result[0][2];
  
  var left_eye_2d_fp = trackData.featurePoints2D.fp[3][4];
  var right_eye_2d_fp = trackData.featurePoints2D.fp[3][5];
  
  var left_eye_2d_pos = [];
  var right_eye_2d_pos = [];
  
  if (left_eye_2d_fp.defined === 1 && right_eye_2d_fp.defined === 1){
    left_eye_2d_pos[0] = left_eye_2d_fp.pos[0];
    left_eye_2d_pos[1] = left_eye_2d_fp.pos[1];
    right_eye_2d_pos[0] = right_eye_2d_fp.pos[0];
    right_eye_2d_pos[1] = right_eye_2d_fp.pos[1];
  }
  
  //apply translation
  var left_gaze_x = dest[0] + left_eye_2d_pos[0];
  var left_gaze_y = dest[1] + left_eye_2d_pos[1];
  
  var right_gaze_x = dest[0] + right_eye_2d_pos[0];
  var right_gaze_y = dest[1] + right_eye_2d_pos[1];
  
  //draw left eye gaze
  canCon.beginPath();
  canCon.moveTo(left_eye_2d_pos[0]*canvas.width,(1-left_eye_2d_pos[1])*canvas.height);
  canCon.lineTo(left_gaze_x*canvas.width,(1-left_gaze_y)*canvas.height);
  canCon.strokeStyle = GAZE_COLOR;
  canCon.lineWidth = 2;
  canCon.stroke();
  canCon.closePath();
  
  //draw right eye gaze
  canCon.beginPath();
  canCon.moveTo(right_eye_2d_pos[0]*canvas.width,(1-right_eye_2d_pos[1])*canvas.height);
  canCon.lineTo(right_gaze_x*canvas.width,(1-right_gaze_y)*canvas.height);
  canCon.strokeStyle = GAZE_COLOR;
  canCon.lineWidth = 2;
  canCon.stroke();
  canCon.closePath();
  
}

/*
* Callback method mentioned in the documentation. 
* Gets executed after all the preparation is done (all the files have been downloaded) and tracker is ready to start tracking.
* In this case it enables buttons on the page.
*/
// function callbackDownload(){
//   //var btnStart = document.getElementById('buttonStart');
//   //var btnStop = document.getElementById('buttonStop');
//   //btnStart.disabled = false;
//   //btnStop.disabled = false;
//   //Start tracking
//   StartTracker();
// }

var timeme = false;
var trackerReturnState = "TRACK_STAT_OFF";

var frameSample = [0,0,0,0,0];
var newSample = [0,0,0,0,0];
var ppixels,
  pixels;

/*
* Compares two samples of 5 pixel values 
*/
function checkFrameDuplicate(newSample){
  for (var i = 0; i <  newSample.length; i+=2){
    if (newSample[i]!==frameSample[i])
      return false;
  }
  //additional check
  for (var i = 1; i < newSample.length; i+= 2)
  {
    if (newSample[i]!==frameSample[i])
      return false;
  }
  return true;
}

/*
* Method that is called on every frame via requestAnimationFrame mechanism.
* Draws camera image on the canvas, takes the pixel data, sends them to the tracker and finally, depending on the result, draws the results.
* Rudimentary timing is implemented to be activated on button click and it also checks for duplicate frames.
*/
function processFrame(){
  window.requestAnimationFrame(processFrame);

  canvas.width = mWidth;
  //Draws an image from cam on the canvas
  canCon.drawImage(video,0,0,mWidth,mHeight);
  
  //Access pixel data 
  imageData = canCon.getImageData(0,0, mWidth, mHeight).data;
  
  //Save pixel data to preallocated buffer
  for(i=0; i<imageData.length; i+=4)
  {
    average = 0.299*imageData[i] + 0.587*imageData[i+1] + 0.114*imageData[i+2];
    pixels[i] = imageData[i];
  }
  
  //Alternative way to save pixel data, seems faster but not consistent
  //pixels.set(imageData);
  
  //Check for duplicate frames (camera only gives out 30 FPS)
  var frameIsDuplicate = false;
  if (frameSample.length !== 0){
    newSample = [];
    for (var i= 1; i < 4; i++){
      newSample.push(imageData[mHeight/(4/i)+(mWidth*4)/(4/1)]);
      newSample.push(imageData[mHeight/(4/i)+(mWidth*4)/(4/2)]);
      newSample.push(imageData[mHeight/(4/i)+(mWidth*4)/(4/3)]);
    }
    frameIsDuplicate = checkFrameDuplicate(newSample);
    
    frameSample = newSample.slice(0);
  }   
  else{
    frameSample = [];
    for (var i= 1; i < 4; i++){
      frameSample.push(imageData[mHeight/(4/i)+(mWidth*4)/(4/1)]);
      frameSample.push(imageData[mHeight/(4/i)+(mWidth*4)/(4/2)]);
      frameSample.push(imageData[mHeight/(4/i)+(mWidth*4)/(4/3)]);
    }
  }
  
  //Call Update() if ready to start tracking and frame is new
  if (startTracking===true && frameIsDuplicate===false){
    trackerReturnState = m_Tracker.track(mWidth,mHeight,ppixels, faceData);
  }
  
  //Draw based upon data if tracker status is OK
  if (startTracking===true && trackerReturnState==="TRACK_STAT_OK"){
    if (draw === true){
      drawFaceFeatures(faceData.featurePoints2D);
      drawGaze(faceData);
    }
    // transOutput.innerHTML = "[" + faceData.faceTranslation[0].toFixed(2) + "," + faceData.faceTranslation[1].toFixed(2) + "," + faceData.faceTranslation[2].toFixed(2) + "]";
    // rotOutput.innerHTML = "[" + faceData.faceRotation[0].toFixed(2) + "," + faceData.faceRotation[1].toFixed(2) + "," + faceData.faceRotation[2].toFixed(2) + "]";
    // fpsTracker.innerHTML = faceData.frameRate.toFixed(2);
  }
  // statOutput.innerHTML = "[" + trackerReturnState + "]";
  
  //Calculate FPS
  if (frameIsDuplicate===false){
    var thisFrameFPS = 1000 / ((now=new Date) - lastUpdate);
    fps += (thisFrameFPS - fps) / fpsFilter;
    lastUpdate = now;
  }

  Daredevil.process(faceData);
}
// //Function called when Start is clicked, tracking is resumed/started
function StartTracker(){
  
  startTracking = true;
}

function StopTracker(){
  startTracking = false;
}

var m_Tracker;
var faceData;
var imageData;

var video = document.createElement('video');

//Handlers for camera communication
//callback methods for getUserMedia : deniedStream, errorStream, startStream
//**************************************************************************

//Alerts the user when there is no camera
function deniedStream(){
  alert("Camera access denied!)");
}
//Pushes error to the console when there is error with camera access
function errorStream(e){
  if (e){
    console.error(e);
  }
}

//Is triggered when cam stream is successfully fetched
//NOTE: Can be buggy, try to increase the value from 1000ms to some higher value in that case
function startStream(stream){
  video.addEventListener('canplay', function DoStuff() {
    video.removeEventListener('canplay', DoStuff, true);
    setTimeout(function() {
      video.play();
  
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      mWidth = video.videoWidth;
      mHeight = video.videoHeight;
      
      ppixels = Module._malloc(mWidth*mHeight*4);
      pixels = new Uint8Array(Module.HEAPU8.buffer, ppixels, mWidth*mHeight*4);
      
      //set up tracker and licensing, valid license needs to be provided
      m_Tracker = new Tracker("js/visage/visage/Facial Features Tracker - Asymmetric.cfg");
      m_Tracker.initializeLicenseManager("122-250-422-916-217-370-249-855-960-549-258.vlc");
      faceData = new FaceData();
  
      //Use request animation frame mechanism - slower but with smoother animation
      processFrame();
      //Use set interval mechanism - faster but depends on browser usage, choppy
      //setInterval(processFrame,1);
    }, 1000);
  }, true);
    
  var domURL = window.URL || window.webkitURL;
  video.src = domURL ? domURL.createObjectURL(stream) : stream;
    
  video.play();
}

//Different browser support for fetching camera stream
window.URL = window.URL || window.webkitURL;
navigator.getUserMedia_ =  navigator.getUserMedia || navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia || navigator.msGetUserMedia;
              
(function() {
  var i = 0,
    lastTime = 0,
    vendors = ['ms', 'moz', 'webkit', 'o'];
  
  while (i < vendors.length && !window.requestAnimationFrame) {
    window.requestAnimationFrame = window[vendors[i] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
          window[vendors[i]+'CancelAnimationFrame'] || window[vendors[i]+'CancelRequestAnimationFrame'];
    i++;
  }
  if (!window.requestAnimationFrame) {
    alert("RequestAnimationFrame mechanism is not supported by this browser.");
  }
}());

//Here is where the stream is fetched
try {
  navigator.getUserMedia_({
    video: true,
    audio: false
  },function () {
    $.event.trigger({
      type: "allowWebcam",
    });
  }, function () {
    $.event.trigger({
      type: "notAllowWebcam",
    });
  });
  } catch (e) {
    try {
      navigator.getUserMedia_('video', function (){
        $.event.trigger({
          type: "allowWebcam",
        });
      }, function () {
        $.event.trigger({
          type: "notAllowWebcam",
        });
      });
    } catch (e) {
      errorStream(e);
    }
  }
video.loop = video.muted = true;
video.autoplay = true;
video.load();

