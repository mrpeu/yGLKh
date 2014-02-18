
GO = function() {
  var camera, renderer, scene, drawStars, stats,
  _dirLight, _ambLight,
  _gun, _gunGeom,
  _baseMat, _terranMat, _terranHighMat, _gunMat,
  _planets = [], _guns = []
  ;

  camera = scene = renderer = stats = void 0;

  var drawStars = function() {
    var canvas, ctx, i, sizeRandom, _i,
    w = window.innerWidth * 1.5, h = window.innerHeight;

    canvas = document.createElement( 'canvas' );
    canvas.setAttribute( 'width', w );
    canvas.setAttribute( 'height', h );
    canvas.setAttribute( 'id', "stars" );
    ctx = canvas.getContext( '2d' );
    ctx.fillStyle = "#ffffff";

    for( i = _i = 0; _i <= 200; i = ++_i ) {
      ctx.beginPath();
      sizeRandom = Math.random() * 2;
      ctx.arc( Math.random() * w, Math.random() * h, sizeRandom, 0, 2 * Math.PI, 0 );
      ctx.fill();
    }

    return document.body.appendChild( canvas );
  };


  //---------
  // label sprite    

  function makeTextSprite( message, parameters ) {
    if( parameters === undefined )
      parameters = {};

    var fontface = parameters.hasOwnProperty( "fontface" ) ?
    parameters["fontface"] : "Arial";

    var fontsize = parameters.hasOwnProperty( "fontsize" ) ?
    parameters["fontsize"] : 18;

    var borderThickness = parameters.hasOwnProperty( "borderThickness" ) ?
    parameters["borderThickness"] : 4;

    var borderColor = parameters.hasOwnProperty( "borderColor" ) ?
    parameters["borderColor"] : { r: 0, g: 0, b: 0, a: 1.0 };

    var backgroundColor = parameters.hasOwnProperty( "backgroundColor" ) ?
    parameters["backgroundColor"] : { r: 255, g: 255, b: 255, a: .5 };

    var canvas = document.createElement( 'canvas' );
    var context = canvas.getContext( '2d' );
    context.font = "Bold " + fontsize + "px " + fontface;

    // get size data (height depends only on font size)
    var metrics = context.measureText( message );
    var textWidth = metrics.width;

    // background color
    context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
    + backgroundColor.b + "," + backgroundColor.a + ")";
    // border color
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
    + borderColor.b + "," + borderColor.a + ")";

    context.lineWidth = borderThickness;
    roundRect( context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6 );
    // 1.4 is extra height factor for text below baseline: g,j,p,q.

    // text color
    context.fillStyle = "rgba(0, 0, 0, 1.0)";

    context.fillText( message, borderThickness, fontsize + borderThickness );

    // canvas contents will be used for a texture
    var texture = new THREE.Texture( canvas )
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial(
    { map: texture, useScreenCoordinates: false } );
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set( 100, 50, 1.0 );
    return sprite;
  }

  // function for drawing rounded rectangles
  function roundRect( ctx, x, y, w, h, r ) {
    ctx.beginPath();
    ctx.moveTo( x + r, y );
    ctx.lineTo( x + w - r, y );
    ctx.quadraticCurveTo( x + w, y, x + w, y + r );
    ctx.lineTo( x + w, y + h - r );
    ctx.quadraticCurveTo( x + w, y + h, x + w - r, y + h );
    ctx.lineTo( x + r, y + h );
    ctx.quadraticCurveTo( x, y + h, x, y + h - r );
    ctx.lineTo( x, y + r );
    ctx.quadraticCurveTo( x, y, x + r, y );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  var addGun = function( planet ) {

    var baseFaces = baseGeom.faces,
    terranFaces = terranGeom.faces,
    terranHighFaces = terranHighGeom.faces,
    max = baseFaces.length,
    f, o, l
    ;

    for( var i = max - 1; i > -1; i-- ) {

      f = terranHighFaces[i];

      if( guns.length < Math.max( 10, baseRadius / 10 ) ) {
        if(
        Math.random() < 0.05
        && f.centroid.length() > baseFaces[i].centroid.length()
        && f.centroid.length() > terranFaces[i].centroid.length()
        ) {

          o = gun.clone();
          o.shoot = gun.shoot;

          o.lookAt( f.centroid );
          o.rotation.z = Math.random() * Math.PI / 2;
          o.position = f.centroid.clone(); //.multiplyScalar( 1.2 );
          o.visible = false;

          l = new THREE.PointLight( 0xffff55, .95, o.geometry.depth * 1.5 );
          l.position.z += o.geometry.depth;
          l.visible = true;

          o.add( l );
          o.light = l;

          //var lightMarker = new THREE.Mesh(
          //  new THREE.SphereGeometry( 20, 7, 7 ),
          //  new THREE.MeshBasicMaterial( { color: 0xeeee00, transparent: true, opacity: 0.75, } )
          //);
          //lightMarker.position = l.position.clone();
          //o.add( lightMarker );

          base.add( o );
          guns[guns.length] = o;

          new TWEEN.Tween( { val: 0, gun: o } )
          .to( { val: 1 }, 1000 )
          .delay( o.scale.z * -500 )
          .onStart( function() {
            this.gun.visible = true;
            this.gun.children[0].visible = true;
          } )
          .onUpdate( function( t ) {
            this.gun.translateZ(( this.val - this.gun.scale.z ) / 2 );
            this.gun.scale.setZ( this.val );
          } )
          .onComplete( function() {
            this.gun.shoot();
          } )
          .easing( TWEEN.Easing.Bounce.Out )
          .start();
        }
      }

    }
  };

  var addPlanet = function( origin, baseRadius ) {

    var base, terran, terranHigh,
      nbBaseSegX = baseRadius / 5, nbBaseSegY = baseRadius / 10,
      baseGeom, terranGeom, terranHighGeom, gunGeom
    ;


    //---------
    // geometries

    baseGeom = new THREE.SphereGeometry( baseRadius, nbBaseSegX, nbBaseSegY );
    terranHighGeom = new THREE.SphereGeometry( baseRadius - 2, nbBaseSegX, nbBaseSegY );
    terranGeom = new THREE.SphereGeometry( baseRadius - 10, nbBaseSegX, nbBaseSegY );

    var knead = function( vertices, amplitude ) {
      for( var i = 0; i < vertices.length; i++ ) {
        if( i % ( nbBaseSegX + 1 ) == 0 )
          // stitch the start and end edges
          vertices[i] = vertices[i + nbBaseSegX];
        else
          vertices[i][["x", "y", "z"][~~( Math.random() * 3 )]] += Math.random() * amplitude;
      }
    };

    knead( baseGeom.vertices, baseRadius * .05 );
    knead( terranGeom.vertices, baseRadius * .1 );
    knead( terranHighGeom.vertices, baseRadius * .14 );

    baseGeom.computeCentroids();
    terranGeom.computeCentroids();
    terranHighGeom.computeCentroids();

    //----------
    // meshes

    base = new THREE.Mesh( baseGeom, _baseMat );
    base.position = origin.clone();

    terran = new THREE.Mesh( terranGeom, _terranMat );
    terranHigh = new THREE.Mesh( terranHighGeom, _terranHighMat );

    scene.add( base );
    base.add( terran );
    base.add( terranHigh );


    var facesAvailableForGuns = [],
    baseFaces = baseGeom.faces,
    terranFaces = terranGeom.faces,
    terranHighFaces = terranHighGeom.faces,
    max = terranHighFaces.length,
    f
    ;

    for( var i = max - 1; i > -1; i-- ) {
      f = terranHighFaces[i];

      if( f.centroid.length() > baseFaces[i].centroid.length()
      && f.centroid.length() > terranFaces[i].centroid.length() ) {
        facesAvailableForGuns[facesAvailableForGuns.length] = f;
      }
    }

    base.facesAvailableForGuns = facesAvailableForGuns;



    var sprite = makeTextSprite( " #" + _planets.length + " ", {
      fontsize: 32
    } );
    sprite.position.set( base.position.x, base.position.y, base.position.z + baseRadius + 50 );
    scene.add( sprite );

    return base;
  };

  window.onload = function() {
    var animate
    ;

    drawStars();

    //camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera = new THREE.OrthographicCamera( -window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, 500, 1250 );
    camera.position.z = 1000;
    scene = new THREE.Scene;


    //----------
    // materials

    _baseMat = new THREE.MeshLambertMaterial( {
      color: 0x76acda,
      transparent: true,
      opacity: 0.75,
      shading: THREE.FlatShading
    } );
    _terranMat = new THREE.MeshLambertMaterial( {
      color: 0xe3c97f,
      shading: THREE.FlatShading
    } );
    _terranHighMat = new THREE.MeshLambertMaterial( {
      color: 0xb8e058,
      shading: THREE.FlatShading
    } );


    //-----------
    // guns

    _gunMat = new THREE.MeshLambertMaterial( {
      color: 0xdfefef,
      shading: THREE.FlatShading,
    } );

    _gunGeom = new THREE.BoxGeometry( 5, 5, 50, 1, 1, 1 );

    _gun = new THREE.Mesh( _gunGeom, _gunMat );

    _gun.shoot = function() {
      new TWEEN.Tween( { sx: 1.8, sy: 1.8, sz: .2, gun: this } )
      .to( { sx: 1, sy: 1, sz: 1 }, 750 )
      .delay( Math.random() * 2000 )
      .easing( TWEEN.Easing.Bounce.Out )
      .onStart( function() {
        this.gun.light.visible = true;
      } )
      .onUpdate( function( t ) {
        var barrel = this.gun.children[0];
        this.gun.scale.set( this.sx, this.sy, this.sz );
        if( t > 0.5 )
          this.gun.light.visible = false;
      } )
      .onComplete( function() {
        this.gun.shoot();
      } )
      .start();
    };

    // barrel
    var barrelGeom = _gunGeom.clone();
    //barrelGeom.applyMatrix( new THREE.Matrix4().makeRotationY( Math.PI/4 ) );
    barrelGeom.applyMatrix( new THREE.Matrix4().makeScale( 1.75, 1.75, .5 ) );
    barrelGeom.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, -_gunGeom.height * .5 / 2 ) );

    barrel = new THREE.Mesh( barrelGeom, _gunMat );
    barrel.name = "barrel";
    barrel.visible = false;

    _gun.add( barrel );


    //------------
    // planets

    var createPlanets = ( function( nb ) {

      var o, r, i, w = window.innerWidth, h = window.innerHeight, valid;

      for( i = 0; i < nb; i++ ) {
        r = Math.random() * 100 + 50;

        do {
          console.log('-----------------');
          valid = true;
          o = new THREE.Vector3( Math.random() * w - w / 2, Math.random() * h - h / 2, 0 );

          for( var j = 0, item = _planets[0]; valid && j < _planets.length; j++ ) {
            var d = item.position.distanceTo( o ),
            min = item.geometry.radius + r + 500;

            if( d > min ) {
              valid = false;
              console.log( '#' + i + '-#' + j + ': ' + ~~d + ' < ' + ~~min );
            }
            else {
              console.log( '#' + i + '-#' + j + ': ' + ~~d + ' > ' + ~~min );
            }
          }

        } while( valid === false )

        _planets[_planets.length] = addPlanet( o, r );
      }

    } )( 5 );


    //---------
    // lights

    _dirLight = new THREE.DirectionalLight( 0xffffff );
    _dirLight.position.set( 1, 1, 1 );
    scene.add( _dirLight );

    _ambLight = new THREE.AmbientLight( 0x2e1527 );
    scene.add( _ambLight );


    //--------
    // setup

    try {
      renderer = new THREE.WebGLRenderer( { alpha: true } );
    } catch( _error ) {
      renderer = new THREE.CanvasRenderer();
      alert( "come back in chrome or firefox! or enable webgl" );
    }

    stats = new rStats( {
      values: {
        frame: { caption: 'Total frame time (ms)', over: 16 },
        fps: { caption: 'Framerate (FPS)', below: 30 },
        render: { caption: 'WebGL Render (ms)' },
        animate: { caption: 'Animation (ms)' }
      },
      fractions: [
          { base: 'frame', steps: ['animate', 'render'] }
      ],
      opencloseTrigger: true
    } );

    var onResize = function() {
      var winWidth = window.innerWidth;
      var winHeight = window.innerHeight;

      camera.aspect = winWidth / winHeight;
      renderer.setSize( winWidth, winHeight );
      camera.updateProjectionMatrix();
    };
    onResize();

    document.body.appendChild( renderer.domElement );

    animate = function() {
      stats( 'frame' ).start();
      stats( 'FPS' ).frame();
      stats( 'animate' ).start();

      _planets.forEach( function( planet ) {
        planet.rotation.y += 0.00525;
      } );

      TWEEN.update();

      stats( 'animate' ).end();

      stats( 'render' ).start();
      renderer.render( scene, camera );
      stats( 'render' ).end();

      stats( 'frame' ).end();
      stats().update();

      requestAnimationFrame( animate );
    };

    return animate();
  };

};

// tween.js - http://github.com/sole/tween.js
'use strict';
void 0 === Date.now && ( Date.now = function() {
  return ( new Date ).valueOf()
} );
var TWEEN = TWEEN || function() {
  var a = [];
  return {
    REVISION: "12", getAll: function() {
      return a
    }, removeAll: function() {
      a = []
    }, add: function( c ) {
      a.push( c )
    }, remove: function( c ) {
      c = a.indexOf( c );
      -1 !== c && a.splice( c, 1 )
    }, update: function( c ) {
      if( 0 === a.length )
        return !1;
      for( var b = 0, c = void 0 !== c ? c : "undefined" !== typeof window && void 0 !== window.performance && void 0 !== window.performance.now ? window.performance.now() : Date.now() ; b < a.length; )
        a[b].update( c ) ? b++ : a.splice( b, 1 );
      return !0
    }
  }
}();
TWEEN.Tween = function( a ) {
  var c = {}, b = {}, d = {}, e = 1E3, g = 0, h = !1, j = !1, q = 0, m = null, v = TWEEN.Easing.Linear.None, w = TWEEN.Interpolation.Linear, n = [], r = null, s = !1, t = null, u = null, k;
  for( k in a )
    c[k] = parseFloat( a[k], 10 );
  this.to = function( a, c ) {
    void 0 !== c && ( e = c );
    b = a;
    return this
  };
  this.start = function( e ) {
    TWEEN.add( this );
    j = !0;
    s = !1;
    m = void 0 !== e ? e : "undefined" !== typeof window && void 0 !== window.performance && void 0 !== window.performance.now ? window.performance.now() : Date.now();
    m += q;
    for( var f in b ) {
      if( b[f] instanceof Array ) {
        if( 0 === b[f].length )
          continue;
        b[f] = [a[f]].concat( b[f] )
      }
      c[f] = a[f];
      !1 === c[f] instanceof Array && ( c[f] *= 1 );
      d[f] = c[f] || 0
    }
    return this
  };
  this.stop = function() {
    if( !j )
      return this;
    TWEEN.remove( this );
    j = !1;
    this.stopChainedTweens();
    return this
  };
  this.stopChainedTweens = function() {
    for( var a = 0, b = n.length; a < b; a++ )
      n[a].stop()
  };
  this.delay = function( a ) {
    q = a;
    return this
  };
  this.repeat = function( a ) {
    g = a;
    return this
  };
  this.yoyo = function( a ) {
    h = a;
    return this
  };
  this.easing = function( a ) {
    v = a;
    return this
  };
  this.interpolation = function( a ) {
    w = a;
    return this
  };
  this.chain = function() {
    n =
    arguments;
    return this
  };
  this.onStart = function( a ) {
    r = a;
    return this
  };
  this.onUpdate = function( a ) {
    t = a;
    return this
  };
  this.onComplete = function( a ) {
    u = a;
    return this
  };
  this.update = function( p ) {
    var f;
    if( p < m )
      return !0;
    !1 === s && ( null !== r && r.call( a ), s = !0 );
    var i = ( p - m ) / e, i = 1 < i ? 1 : i, j = v( i );
    for( f in b ) {
      var k = c[f] || 0, l = b[f];
      l instanceof Array ? a[f] = w( l, j ) : ( "string" === typeof l && ( l = k + parseFloat( l, 10 ) ), "number" === typeof l && ( a[f] = k + ( l - k ) * j ) )
    }
    null !== t && t.call( a, j );
    if( 1 == i )
      if( 0 < g ) {
        isFinite( g ) && g--;
        for( f in d )
          "string" === typeof b[f] &&
          ( d[f] += parseFloat( b[f], 10 ) ), h && ( i = d[f], d[f] = b[f], b[f] = i ), c[f] = d[f];
        m = p + q
      } else {
        null !== u && u.call( a );
        f = 0;
        for( i = n.length; f < i; f++ )
          n[f].start( p );
        return !1
      }
    return !0
  }
};
TWEEN.Easing = {
  Linear: {
    None: function( a ) {
      return a
    }
  }, Quadratic: {
    In: function( a ) {
      return a * a
    }, Out: function( a ) {
      return a * ( 2 - a )
    }, InOut: function( a ) {
      return 1 > ( a *= 2 ) ? 0.5 * a * a : -0.5 * ( --a * ( a - 2 ) - 1 )
    }
  }, Cubic: {
    In: function( a ) {
      return a * a * a
    }, Out: function( a ) {
      return --a * a * a + 1
    }, InOut: function( a ) {
      return 1 > ( a *= 2 ) ? 0.5 * a * a * a : 0.5 * ( ( a -= 2 ) * a * a + 2 )
    }
  }, Quartic: {
    In: function( a ) {
      return a * a * a * a
    }, Out: function( a ) {
      return 1 - --a * a * a * a
    }, InOut: function( a ) {
      return 1 > ( a *= 2 ) ? 0.5 * a * a * a * a : -0.5 * ( ( a -= 2 ) * a * a * a - 2 )
    }
  }, Quintic: {
    In: function( a ) {
      return a * a * a *
      a * a
    }, Out: function( a ) {
      return --a * a * a * a * a + 1
    }, InOut: function( a ) {
      return 1 > ( a *= 2 ) ? 0.5 * a * a * a * a * a : 0.5 * ( ( a -= 2 ) * a * a * a * a + 2 )
    }
  }, Sinusoidal: {
    In: function( a ) {
      return 1 - Math.cos( a * Math.PI / 2 )
    }, Out: function( a ) {
      return Math.sin( a * Math.PI / 2 )
    }, InOut: function( a ) {
      return 0.5 * ( 1 - Math.cos( Math.PI * a ) )
    }
  }, Exponential: {
    In: function( a ) {
      return 0 === a ? 0 : Math.pow( 1024, a - 1 )
    }, Out: function( a ) {
      return 1 === a ? 1 : 1 - Math.pow( 2, -10 * a )
    }, InOut: function( a ) {
      return 0 === a ? 0 : 1 === a ? 1 : 1 > ( a *= 2 ) ? 0.5 * Math.pow( 1024, a - 1 ) : 0.5 * ( -Math.pow( 2, -10 * ( a - 1 ) ) + 2 )
    }
  }, Circular: {
    In: function( a ) {
      return 1 -
      Math.sqrt( 1 - a * a )
    }, Out: function( a ) {
      return Math.sqrt( 1 - --a * a )
    }, InOut: function( a ) {
      return 1 > ( a *= 2 ) ? -0.5 * ( Math.sqrt( 1 - a * a ) - 1 ) : 0.5 * ( Math.sqrt( 1 - ( a -= 2 ) * a ) + 1 )
    }
  }, Elastic: {
    In: function( a ) {
      var c, b = 0.1;
      if( 0 === a )
        return 0;
      if( 1 === a )
        return 1;
      !b || 1 > b ? ( b = 1, c = 0.1 ) : c = 0.4 * Math.asin( 1 / b ) / ( 2 * Math.PI );
      return -( b * Math.pow( 2, 10 * ( a -= 1 ) ) * Math.sin(( a - c ) * 2 * Math.PI / 0.4 ) )
    }, Out: function( a ) {
      var c, b = 0.1;
      if( 0 === a )
        return 0;
      if( 1 === a )
        return 1;
      !b || 1 > b ? ( b = 1, c = 0.1 ) : c = 0.4 * Math.asin( 1 / b ) / ( 2 * Math.PI );
      return b * Math.pow( 2, -10 * a ) * Math.sin(( a - c ) *
      2 * Math.PI / 0.4 ) + 1
    }, InOut: function( a ) {
      var c, b = 0.1;
      if( 0 === a )
        return 0;
      if( 1 === a )
        return 1;
      !b || 1 > b ? ( b = 1, c = 0.1 ) : c = 0.4 * Math.asin( 1 / b ) / ( 2 * Math.PI );
      return 1 > ( a *= 2 ) ? -0.5 * b * Math.pow( 2, 10 * ( a -= 1 ) ) * Math.sin(( a - c ) * 2 * Math.PI / 0.4 ) : 0.5 * b * Math.pow( 2, -10 * ( a -= 1 ) ) * Math.sin(( a - c ) * 2 * Math.PI / 0.4 ) + 1
    }
  }, Back: {
    In: function( a ) {
      return a * a * ( 2.70158 * a - 1.70158 )
    }, Out: function( a ) {
      return --a * a * ( 2.70158 * a + 1.70158 ) + 1
    }, InOut: function( a ) {
      return 1 > ( a *= 2 ) ? 0.5 * a * a * ( 3.5949095 * a - 2.5949095 ) : 0.5 * ( ( a -= 2 ) * a * ( 3.5949095 * a + 2.5949095 ) + 2 )
    }
  }, Bounce: {
    In: function( a ) {
      return 1 -
      TWEEN.Easing.Bounce.Out( 1 - a )
    }, Out: function( a ) {
      return a < 1 / 2.75 ? 7.5625 * a * a : a < 2 / 2.75 ? 7.5625 * ( a -= 1.5 / 2.75 ) * a + 0.75 : a < 2.5 / 2.75 ? 7.5625 * ( a -= 2.25 / 2.75 ) * a + 0.9375 : 7.5625 * ( a -= 2.625 / 2.75 ) * a + 0.984375
    }, InOut: function( a ) {
      return 0.5 > a ? 0.5 * TWEEN.Easing.Bounce.In( 2 * a ) : 0.5 * TWEEN.Easing.Bounce.Out( 2 * a - 1 ) + 0.5
    }
  }
};
TWEEN.Interpolation = {
  Linear: function( a, c ) {
    var b = a.length - 1, d = b * c, e = Math.floor( d ), g = TWEEN.Interpolation.Utils.Linear;
    return 0 > c ? g( a[0], a[1], d ) : 1 < c ? g( a[b], a[b - 1], b - d ) : g( a[e], a[e + 1 > b ? b : e + 1], d - e )
  }, Bezier: function( a, c ) {
    var b = 0, d = a.length - 1, e = Math.pow, g = TWEEN.Interpolation.Utils.Bernstein, h;
    for( h = 0; h <= d; h++ )
      b += e( 1 - c, d - h ) * e( c, h ) * a[h] * g( d, h );
    return b
  }, CatmullRom: function( a, c ) {
    var b = a.length - 1, d = b * c, e = Math.floor( d ), g = TWEEN.Interpolation.Utils.CatmullRom;
    return a[0] === a[b] ? ( 0 > c && ( e = Math.floor( d = b * ( 1 + c ) ) ), g( a[( e -
    1 + b ) % b], a[e], a[( e + 1 ) % b], a[( e + 2 ) % b], d - e ) ) : 0 > c ? a[0] - ( g( a[0], a[0], a[1], a[1], -d ) - a[0] ) : 1 < c ? a[b] - ( g( a[b], a[b], a[b - 1], a[b - 1], d - b ) - a[b] ) : g( a[e ? e - 1 : 0], a[e], a[b < e + 1 ? b : e + 1], a[b < e + 2 ? b : e + 2], d - e )
  }, Utils: {
    Linear: function( a, c, b ) {
      return ( c - a ) * b + a
    }, Bernstein: function( a, c ) {
      var b = TWEEN.Interpolation.Utils.Factorial;
      return b( a ) / b( c ) / b( a - c )
    }, Factorial: function() {
      var a = [1];
      return function( c ) {
        var b = 1, d;
        if( a[c] )
          return a[c];
        for( d = c; 1 < d; d-- )
          b *= d;
        return a[c] = b
      }
    }(), CatmullRom: function( a, c, b, d, e ) {
      var a = 0.5 * ( b - a ), d = 0.5 * ( d - c ), g =
      e * e;
      return ( 2 * c - 2 * b + a + d ) * e * g + ( -3 * c + 3 * b - 2 * a - d ) * g + a * e + c
    }
  }
};


GO.call( this );
