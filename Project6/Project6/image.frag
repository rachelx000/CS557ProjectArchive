// make this 120 for the mac:
#version 330 compatibility

in vec2 vST;

uniform sampler2D CubeUnit, GlassUnit, DiamondUnit;
uniform float	  uSc, uTc, uRad;
uniform float	  uTransit;
uniform bool	  uUseLens;

const vec3 WHITE = vec3( 1., 1., 1. ) ;

void
main( )
{	
	// change the fragment's (s,t) so that it is with respect to the center (uSc,uTc) of the Magic Lens:
	vec2 st = vST - vec2( uSc, uTc );
	float r = length( st );
	vec3 CubeRGB = texture(CubeUnit, vST).rgb;
	vec3 GlassRGB = texture(GlassUnit, vST).rgb;
	vec3 DiamondRGB = texture(DiamondUnit, vST).rgb;

	vec3 color;
	if ( r > uRad )
	{
		if (GlassRGB == vec3(0., 0., 0.))
			color = CubeRGB;
		else 
			color = GlassRGB;
		
	}
	else
	{	
		if (DiamondRGB == vec3(0., 0., 0.))	
			color = CubeRGB;
		else 
			color = mix( GlassRGB, DiamondRGB, uTransit );

		// add the edge of magic lens:
		if ( r > uRad - 0.005 ) 
			color = mix( WHITE, color, 0.5 );
	}
	gl_FragColor = vec4( color, 1. );
}

